"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, asc, eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  cartItems,
  carts,
  colors,
  guest,
  productImages,
  products,
  productVariants,
  sizes,
} from "@/lib/db/schema";

/**
 * Brillivo cart server actions.
 *
 * Resolution model
 * ----------------
 * Every cart belongs to either an authenticated user (`carts.user_id`) or a
 * guest session (`carts.guest_id`). `resolveCart()` picks the right owner:
 *   1. Signed-in user  → the user's cart (created on first use).
 *   2. Guest session    → the guest's cart, bootstrapping a guest session +
 *                         httpOnly cookie when one does not yet exist.
 *
 * All actions return a serializable {@link CartView} so the client can mirror
 * the canonical server state in the Zustand store.
 */

const GUEST_COOKIE_NAME = "guest_session";
const GUEST_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const GUEST_COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/" as const,
  maxAge: GUEST_SESSION_MAX_AGE_SECONDS,
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CartItemView = {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string | null;
  color: { name: string; slug: string; hexCode: string } | null;
  size: { name: string; slug: string } | null;
  inStock: number;
};

export type CartView = {
  items: CartItemView[];
  itemCount: number;
  subtotal: number;
  owner: "user" | "guest";
};

export type CartActionResult =
  | { ok: true; cart: CartView }
  | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/*  Ownership helpers                                                          */
/* -------------------------------------------------------------------------- */

function isDynamicUsageError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

async function getOptionalUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
  } catch (error) {
    if (isDynamicUsageError(error)) throw error;
    console.error("Failed to resolve the current user for the cart.", error);
    return null;
  }
}

/** Returns the active guest `id`, creating a guest session + cookie if needed. */
async function ensureGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (token) {
    const existing = await db
      .select({ id: guest.id, expiresAt: guest.expiresAt })
      .from(guest)
      .where(eq(guest.sessionToken, token))
      .limit(1);

    const record = existing[0];
    if (record && record.expiresAt.getTime() > Date.now()) {
      return record.id;
    }
  }

  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + GUEST_SESSION_MAX_AGE_SECONDS * 1000);

  const [created] = await db
    .insert(guest)
    .values({ sessionToken, expiresAt })
    .returning({ id: guest.id });

  cookieStore.set(GUEST_COOKIE_NAME, sessionToken, GUEST_COOKIE_OPTIONS);

  return created.id;
}

type ResolvedCart = { cartId: string; owner: "user" | "guest" };

/**
 * Read-only cart resolution used during SSR.
 *
 * Unlike {@link resolveCart} this never creates a guest session, a cookie or a
 * cart row — those writes are illegal outside a Server Action / Route Handler.
 * Returns `null` when the visitor has no cart yet.
 */
async function resolveCartForRead(): Promise<ResolvedCart | null> {
  const userId = await getOptionalUserId();

  if (userId) {
    const existing = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    return existing[0] ? { cartId: existing[0].id, owner: "user" } : null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  if (!token) return null;

  const guestRows = await db
    .select({ id: guest.id, expiresAt: guest.expiresAt })
    .from(guest)
    .where(eq(guest.sessionToken, token))
    .limit(1);

  const guestRecord = guestRows[0];
  if (!guestRecord || guestRecord.expiresAt.getTime() <= Date.now()) return null;

  const existing = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.guestId, guestRecord.id))
    .limit(1);

  return existing[0] ? { cartId: existing[0].id, owner: "guest" } : null;
}

/** Resolves (creating when necessary) the cart for the current visitor. */
async function resolveCart(): Promise<ResolvedCart> {
  const userId = await getOptionalUserId();

  if (userId) {
    const existing = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (existing[0]) {
      return { cartId: existing[0].id, owner: "user" };
    }

    const [created] = await db
      .insert(carts)
      .values({ userId })
      .returning({ id: carts.id });

    return { cartId: created.id, owner: "user" };
  }

  const guestId = await ensureGuestId();
  const existing = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.guestId, guestId))
    .limit(1);

  if (existing[0]) {
    return { cartId: existing[0].id, owner: "guest" };
  }

  const [created] = await db
    .insert(carts)
    .values({ guestId })
    .returning({ id: carts.id });

  return { cartId: created.id, owner: "guest" };
}

/* -------------------------------------------------------------------------- */
/*  Read helpers                                                               */
/* -------------------------------------------------------------------------- */

function toNumber(value: string | number | null): number {
  if (value === null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Loads the display payload for a cart, computing per-line and grand totals. */
async function loadCartView(cartId: string, owner: "user" | "guest"): Promise<CartView> {
  const rows = await db
    .select({
      id: cartItems.id,
      variantId: cartItems.productVariantId,
      quantity: cartItems.quantity,
      price: productVariants.price,
      salePrice: productVariants.salePrice,
      inStock: productVariants.inStock,
      productId: products.id,
      productName: products.name,
      colorName: colors.name,
      colorSlug: colors.slug,
      colorHex: colors.hexCode,
      sizeName: sizes.name,
      sizeSlug: sizes.slug,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(colors, eq(productVariants.colorId, colors.id))
    .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));

  const variantIds = rows.map((row) => row.variantId);

  const imageRows = variantIds.length
    ? await db
        .select({
          variantId: productImages.variantId,
          productId: productImages.productId,
          url: productImages.url,
          isPrimary: productImages.isPrimary,
          sortOrder: productImages.sortOrder,
        })
        .from(productImages)
        .where(
          inArray(productImages.productId, rows.map((row) => row.productId))
        )
    : [];

  // Best image per product: primary first, then lowest sort order. Prefer a
  // variant-specific shot when the image is bound to one of our variants.
  const bestImage = new Map<string, { url: string; score: number }>();
  for (const image of imageRows) {
    const score =
      (image.isPrimary ? 0 : 100) +
      image.sortOrder +
      (image.variantId && variantIds.includes(image.variantId) ? -1000 : 0);
    const current = bestImage.get(image.productId);
    if (!current || score < current.score) {
      bestImage.set(image.productId, { url: image.url, score });
    }
  }

  const items: CartItemView[] = rows.map((row) => {
    const unitPrice = toNumber(row.salePrice ?? row.price);
    return {
      id: row.id,
      variantId: row.variantId,
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
      size: row.sizeName && row.sizeSlug ? { name: row.sizeName, slug: row.sizeSlug } : null,
      inStock: row.inStock,
    };
  });

  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return { items, itemCount, subtotal, owner };
}

/* -------------------------------------------------------------------------- */
/*  Public actions                                                             */
/* -------------------------------------------------------------------------- */

/** Fetches the current visitor's cart, or an empty one when none exists yet. */
export async function getCart(): Promise<CartView> {
  const resolved = await resolveCartForRead();
  if (!resolved) {
    return { items: [], itemCount: 0, subtotal: 0, owner: "guest" };
  }
  return loadCartView(resolved.cartId, resolved.owner);
}

/**
 * Adds a product variant to the cart.
 *
 * If the variant already exists in the cart its quantity is incremented, which
 * is enforced by the `cart_items_cart_variant_unique` constraint.
 */
export async function addCartItem(
  variantId: string,
  quantity = 1
): Promise<CartActionResult> {
  if (!variantId) {
    return { ok: false, error: "A product variant is required." };
  }

  const safeQuantity = Math.max(1, Math.floor(quantity));

  try {
    const { cartId, owner } = await resolveCart();

    const variantRows = await db
      .select({ id: productVariants.id, inStock: productVariants.inStock })
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    const variant = variantRows[0];
    if (!variant) {
      return { ok: false, error: "That piece is no longer available." };
    }

    const existing = await db
      .select({ id: cartItems.id, quantity: cartItems.quantity })
      .from(cartItems)
      .where(
        and(eq(cartItems.cartId, cartId), eq(cartItems.productVariantId, variantId))
      )
      .limit(1);

    if (existing[0]) {
      const maxQuantity = variant.inStock > 0 ? variant.inStock : Number.MAX_SAFE_INTEGER;
      const nextQuantity = Math.min(existing[0].quantity + safeQuantity, maxQuantity);
      await db
        .update(cartItems)
        .set({ quantity: nextQuantity })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId,
        productVariantId: variantId,
        quantity: safeQuantity,
      });
    }

    await touchCart(cartId);
    return { ok: true, cart: await loadCartView(cartId, owner) };
  } catch (error) {
    console.error("Failed to add the item to the cart.", error);
    return { ok: false, error: "Unable to add this piece to your bag." };
  }
}

/** Sets an exact quantity for a cart line. Quantities below 1 remove the line. */
export async function updateCartItem(
  cartItemId: string,
  quantity: number
): Promise<CartActionResult> {
  if (!cartItemId) {
    return { ok: false, error: "A cart item is required." };
  }

  if (quantity < 1) {
    return removeCartItem(cartItemId);
  }

  try {
    const { cartId, owner } = await resolveCart();

    const rows = await db
      .select({ id: cartItems.id, inStock: productVariants.inStock })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)))
      .limit(1);

    const item = rows[0];
    if (!item) {
      return { ok: false, error: "That item is no longer in your bag." };
    }

    const maxQuantity = item.inStock > 0 ? item.inStock : Number.MAX_SAFE_INTEGER;
    const nextQuantity = Math.min(Math.max(1, Math.floor(quantity)), maxQuantity);

    await db
      .update(cartItems)
      .set({ quantity: nextQuantity })
      .where(eq(cartItems.id, cartItemId));

    await touchCart(cartId);
    return { ok: true, cart: await loadCartView(cartId, owner) };
  } catch (error) {
    console.error("Failed to update the cart item.", error);
    return { ok: false, error: "Unable to update this item." };
  }
}

/** Removes a single line from the cart. */
export async function removeCartItem(cartItemId: string): Promise<CartActionResult> {
  try {
    const { cartId, owner } = await resolveCart();

    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)));

    await touchCart(cartId);
    return { ok: true, cart: await loadCartView(cartId, owner) };
  } catch (error) {
    console.error("Failed to remove the cart item.", error);
    return { ok: false, error: "Unable to remove this item." };
  }
}

/** Empties the cart. */
export async function clearCart(): Promise<CartActionResult> {
  try {
    const { cartId, owner } = await resolveCart();
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    await touchCart(cartId);
    return { ok: true, cart: await loadCartView(cartId, owner) };
  } catch (error) {
    console.error("Failed to clear the cart.", error);
    return { ok: false, error: "Unable to empty your bag." };
  }
}

async function touchCart(cartId: string): Promise<void> {
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
}

/* -------------------------------------------------------------------------- */
/*  Guest → user merge                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Moves every line from the guest cart into the user's cart, summing quantities
 * for variants present in both, then deletes the now-empty guest cart. Safe to
 * call at any time (e.g. right after sign-in/sign-up); a no-op when there is no
 * guest cart or no signed-in user.
 *
 * `explicitUserId` lets the auth actions pass the freshly-authenticated user id
 * directly, since `headers()` may not yet expose the new session cookie within
 * the same request.
 */
export async function mergeGuestCartIntoUserCart(
  explicitUserId?: string,
  explicitGuestToken?: string
): Promise<{ ok: boolean; merged: boolean }> {
  try {
    const userId = explicitUserId ?? (await getOptionalUserId());
    if (!userId) return { ok: true, merged: false };

    const cookieStore = await cookies();
    const token = explicitGuestToken ?? cookieStore.get(GUEST_COOKIE_NAME)?.value;

    if (!token) return { ok: true, merged: false };

    const guestRows = await db
      .select({ id: guest.id })
      .from(guest)
      .where(eq(guest.sessionToken, token))
      .limit(1);

    const guestRecord = guestRows[0];
    if (!guestRecord) return { ok: true, merged: false };

    const guestCartRows = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.guestId, guestRecord.id))
      .limit(1);

    const guestCart = guestCartRows[0];
    if (!guestCart) {
      return { ok: true, merged: false };
    }

    const guestItems = await db
      .select({
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));

    // The Neon HTTP driver does not support interactive transactions, so the
    // merge runs as ordered, idempotent statements. A retry after a partial
    // failure simply tops up the user cart without duplicating lines.
    const userCartRows = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    const userCartId =
      userCartRows[0]?.id ??
      (await db.insert(carts).values({ userId }).returning({ id: carts.id }))[0].id;

    for (const item of guestItems) {
      const existing = await db
        .select({ id: cartItems.id, quantity: cartItems.quantity })
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, userCartId),
            eq(cartItems.productVariantId, item.productVariantId)
          )
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(cartItems)
          .set({ quantity: existing[0].quantity + item.quantity })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        await db.insert(cartItems).values({
          cartId: userCartId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        });
      }
    }

    // Clean up the guest cart (cascade deletes its items). The guest row and
    // the guest cookie are removed by the caller once every domain has merged.
    await db.delete(carts).where(eq(carts.id, guestCart.id));

    return { ok: true, merged: guestItems.length > 0 };
  } catch (error) {
    console.error("Failed to merge the guest cart into the user cart.", error);
    return { ok: false, merged: false };
  }
}
