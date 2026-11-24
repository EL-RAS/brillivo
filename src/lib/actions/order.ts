"use server";

import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import {
  addresses,
  cartItems,
  carts,
  colors,
  orderItems,
  orders,
  payments,
  productImages,
  productVariants,
  products,
  sizes,
  type Order,
  type Payment,
} from "@/lib/db/schema";
import {
  ADDRESS_CONTACT_LIMITS,
  decodeAddressContact,
  encodeAddressContact,
  formatOrderNumber,
} from "@/lib/utils/order";

/**
 * Cash on Delivery checkout.
 *
 * The order is written with a single `db.batch()` call. Drizzle's Neon HTTP
 * driver does not support interactive transactions, but `batch()` maps to
 * Neon's non-interactive `transaction()`, so every statement commits together
 * or not at all — no partial orders, no stock decremented without an order.
 */

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

export type CheckoutField =
  | "fullName"
  | "phone"
  | "city"
  | "streetAddress"
  | "building"
  | "deliveryNotes"
  | "country"
  | "postalCode";

const checkoutFieldNames: readonly CheckoutField[] = [
  "fullName",
  "phone",
  "city",
  "streetAddress",
  "building",
  "deliveryNotes",
  "country",
  "postalCode",
];

export type CheckoutFieldErrors = Partial<Record<CheckoutField, string>>;

export type CodOrderResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { ok: false; error: string; fieldErrors?: CheckoutFieldErrors };

const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the name for delivery.")
    .max(ADDRESS_CONTACT_LIMITS.fullName, "Name is too long."),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a phone number we can reach you on.")
    .max(ADDRESS_CONTACT_LIMITS.phone, "Phone number is too long.")
    .regex(/^[+0-9().\-\s]+$/, "Enter a valid phone number."),
  city: z
    .string()
    .trim()
    .min(1, "City is required.")
    .max(120, "City is too long."),
  streetAddress: z
    .string()
    .trim()
    .min(3, "Street address is required.")
    .max(255, "Street address is too long."),
  building: z
    .string()
    .trim()
    .max(ADDRESS_CONTACT_LIMITS.building, "Building / apartment is too long.")
    .optional()
    .default(""),
  deliveryNotes: z
    .string()
    .trim()
    .max(ADDRESS_CONTACT_LIMITS.notes, "Delivery notes are too long.")
    .optional()
    .default(""),
  country: z
    .string()
    .trim()
    .min(1, "Country is required.")
    .max(120, "Country is too long.")
    .default("Jordan"),
  postalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required.")
    .max(32, "Postal code is too long."),
});

function formValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function firstFieldErrors(error: z.ZodError): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      (checkoutFieldNames as readonly string[]).includes(field) &&
      !errors[field as CheckoutField]
    ) {
      errors[field as CheckoutField] = issue.message;
    }
  }

  return errors;
}

function toCents(value: string | number | null): number {
  if (value === null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

/* -------------------------------------------------------------------------- */
/*  Create order                                                              */
/* -------------------------------------------------------------------------- */

export async function createCodOrder(formData: FormData): Promise<CodOrderResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, error: "Please sign in to place your order." };
  }

  const parsed = checkoutSchema.safeParse({
    fullName: formValue(formData, "fullName"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    streetAddress: formValue(formData, "streetAddress"),
    building: formValue(formData, "building"),
    deliveryNotes: formValue(formData, "deliveryNotes"),
    country: formValue(formData, "country"),
    postalCode: formValue(formData, "postalCode"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please review the highlighted details and try again.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  try {
    const cartRows = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, user.id))
      .limit(1);

    const cart = cartRows[0];
    if (!cart) {
      return { ok: false, error: "Your bag is empty. Add a piece before checking out." };
    }

    const lines = await db
      .select({
        cartItemId: cartItems.id,
        variantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
        price: productVariants.price,
        salePrice: productVariants.salePrice,
        inStock: productVariants.inStock,
        productName: products.name,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartItems.cartId, cart.id))
      .orderBy(asc(cartItems.createdAt));

    if (lines.length === 0) {
      return { ok: false, error: "Your bag is empty. Add a piece before checking out." };
    }

    for (const line of lines) {
      if (line.quantity < 1) {
        return { ok: false, error: "One of your pieces has an invalid quantity." };
      }
      if (line.inStock < line.quantity) {
        return {
          ok: false,
          error:
            line.inStock <= 0
              ? `${line.productName} is no longer in stock.`
              : `Only ${line.inStock} of ${line.productName} remain. Please update your bag.`,
        };
      }
    }

    const subtotalCents = lines.reduce(
      (total, line) => total + toCents(line.salePrice ?? line.price) * line.quantity,
      0
    );

    if (subtotalCents <= 0) {
      return { ok: false, error: "Your bag total is invalid. Please refresh and try again." };
    }

    const orderId = randomUUID();
    const shippingAddressId = randomUUID();
    const billingAddressId = randomUUID();

    const contactLine2 = encodeAddressContact({
      fullName: input.fullName,
      phone: input.phone,
      building: input.building,
      notes: input.deliveryNotes,
    });

    const addressValues = {
      userId: user.id,
      line1: input.streetAddress,
      line2: contactLine2,
      city: input.city,
      // The schema requires `state`; the checkout form intentionally stays
      // minimal, so the city doubles as the administrative area.
      state: input.city,
      country: input.country,
      postalCode: input.postalCode,
    };

    const stockUpdates = lines.map((line) =>
      db
        .update(productVariants)
        .set({ inStock: sql`${productVariants.inStock} - ${line.quantity}` })
        .where(
          and(
            eq(productVariants.id, line.variantId),
            gte(productVariants.inStock, line.quantity)
          )
        )
    );

    await db.batch([
      db.insert(addresses).values({
        id: shippingAddressId,
        type: "shipping",
        ...addressValues,
      }),
      db.insert(addresses).values({
        id: billingAddressId,
        type: "billing",
        ...addressValues,
      }),
      db.insert(orders).values({
        id: orderId,
        userId: user.id,
        status: "pending",
        totalAmount: (subtotalCents / 100).toFixed(2),
        shippingAddressId,
        billingAddressId,
      }),
      db.insert(orderItems).values(
        lines.map((line) => ({
          id: randomUUID(),
          orderId,
          productVariantId: line.variantId,
          quantity: line.quantity,
          priceAtPurchase: (toCents(line.salePrice ?? line.price) / 100).toFixed(2),
        }))
      ),
      db.insert(payments).values({
        id: randomUUID(),
        orderId,
        method: "cod",
        status: "initiated",
      }),
      ...stockUpdates,
      db.delete(cartItems).where(eq(cartItems.cartId, cart.id)),
      db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id)),
    ]);

    return { ok: true, orderId, orderNumber: formatOrderNumber(orderId) };
  } catch (error) {
    console.error("Failed to create the cash-on-delivery order.", error);
    return {
      ok: false,
      error: "We couldn't place your order. Please try again in a moment.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Confirmation                                                              */
/* -------------------------------------------------------------------------- */

export type OrderConfirmationItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string | null;
  color: { name: string; slug: string; hexCode: string } | null;
  size: { name: string; slug: string } | null;
};

export type OrderConfirmation = {
  orderId: string;
  orderNumber: string;
  status: Order["status"];
  paymentMethod: Payment["method"] | null;
  paymentStatus: Payment["status"] | null;
  createdAt: string;
  total: number;
  subtotal: number;
  items: OrderConfirmationItem[];
  shipping: {
    fullName: string;
    phone: string;
    building: string;
    notes: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
};

const uuidSchema = z.string().uuid();

/** Loads an order for the confirmation page, scoped to the signed-in user. */
export async function getOrderConfirmation(
  orderId: string
): Promise<OrderConfirmation | null> {
  if (!uuidSchema.safeParse(orderId).success) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        line1: addresses.line1,
        line2: addresses.line2,
        city: addresses.city,
        state: addresses.state,
        country: addresses.country,
        postalCode: addresses.postalCode,
      })
      .from(orders)
      .innerJoin(addresses, eq(orders.shippingAddressId, addresses.id))
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);

    const order = orderRows[0];
    if (!order) return null;

    const itemRows = await db
      .select({
        id: orderItems.id,
        variantId: orderItems.productVariantId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        productId: products.id,
        productName: products.name,
        colorName: colors.name,
        colorSlug: colors.slug,
        colorHex: colors.hexCode,
        sizeName: sizes.name,
        sizeSlug: sizes.slug,
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(colors, eq(productVariants.colorId, colors.id))
      .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.createdAt));

    const productIds = [...new Set(itemRows.map((row) => row.productId))];

    const imageRows = productIds.length
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            isPrimary: productImages.isPrimary,
            sortOrder: productImages.sortOrder,
          })
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
      : [];

    const bestImage = new Map<string, { url: string; score: number }>();
    for (const image of imageRows) {
      const score = (image.isPrimary ? 0 : 100) + image.sortOrder;
      const current = bestImage.get(image.productId);
      if (!current || score < current.score) {
        bestImage.set(image.productId, { url: image.url, score });
      }
    }

    const items: OrderConfirmationItem[] = itemRows.map((row) => {
      const unitPrice = toCents(row.priceAtPurchase) / 100;
      return {
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        quantity: row.quantity,
        unitPrice,
        lineTotal: unitPrice * row.quantity,
        imageUrl: bestImage.get(row.productId)?.url ?? null,
        color:
          row.colorName && row.colorSlug && row.colorHex
            ? { name: row.colorName, slug: row.colorSlug, hexCode: row.colorHex }
            : null,
        size:
          row.sizeName && row.sizeSlug
            ? { name: row.sizeName, slug: row.sizeSlug }
            : null,
      };
    });

    const [paymentRow] = await db
      .select({ method: payments.method, status: payments.status })
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .limit(1);

    const contact = decodeAddressContact(order.line2);
    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);

    return {
      orderId: order.id,
      orderNumber: formatOrderNumber(order.id),
      status: order.status,
      paymentMethod: paymentRow?.method ?? null,
      paymentStatus: paymentRow?.status ?? null,
      createdAt: order.createdAt.toISOString(),
      total: toCents(order.totalAmount) / 100,
      subtotal,
      items,
      shipping: {
        fullName: contact.fullName,
        phone: contact.phone,
        building: contact.building,
        notes: contact.notes,
        line1: order.line1,
        line2: order.line2,
        city: order.city,
        state: order.state,
        country: order.country,
        postalCode: order.postalCode,
      },
    };
  } catch (error) {
    console.error("Failed to load the order confirmation.", error);
    return null;
  }
}
