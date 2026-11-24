"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, asc, eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  categories,
  genders,
  guest,
  productImages,
  products,
  productVariants,
  wishlists,
} from "@/lib/db/schema";

/**
 * Brillivo wishlist server actions.
 *
 * Ownership model
 * ---------------
 * Mirrors the cart exactly. Every wishlist row belongs to either an
 * authenticated user (`wishlists.user_id`) or a guest session
 * (`wishlists.guest_id`). `resolveWishlistOwner()` picks the right owner:
 *   1. Signed-in user  → the user's wishlist rows.
 *   2. Guest session    → the guest's rows, bootstrapping a guest session +
 *                         httpOnly cookie when one does not yet exist.
 *
 * Guests can therefore favourite pieces instantly, without an account. On
 * sign-in/sign-up {@link mergeGuestWishlistIntoUserWishlist} folds the guest
 * rows into the user's account (see `src/lib/auth/actions.ts`).
 *
 * Every action returns a serializable {@link WishlistView} so the client can
 * mirror the canonical server state in the Zustand store, exactly like the cart.
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

const PLACEHOLDER_IMAGE = "/products/ring_01.jpg";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type WishlistItemView = {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  categoryName: string;
  categorySlug: string;
  genderLabel: string;
  genderSlug: string;
  imageUrl: string;
  minPrice: number | null;
  maxPrice: number | null;
  defaultVariantId: string | null;
  addedAt: string;
};

export type WishlistView = {
  items: WishlistItemView[];
  count: number;
  owner: "user" | "guest";
  /** Always true now that guests persist via `guest_id`. */
  canPersist: boolean;
};

export type WishlistActionResult =
  | { ok: true; wishlist: WishlistView }
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
    console.error("Failed to resolve the current user for the wishlist.", error);
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

type WishlistOwner =
  | { owner: "user"; userId: string }
  | { owner: "guest"; guestId: string };

/**
 * Read-only owner resolution used during SSR.
 *
 * Never creates a guest session, cookie or row — those writes are illegal
 * outside a Server Action / Route Handler. Returns `null` when the visitor has
 * no wishlist owner yet.
 */
async function resolveOwnerForRead(): Promise<WishlistOwner | null> {
  const userId = await getOptionalUserId();
  if (userId) return { owner: "user", userId };

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

  return { owner: "guest", guestId: guestRecord.id };
}

/** Resolves (creating a guest session when necessary) the wishlist owner. */
async function resolveOwner(): Promise<WishlistOwner> {
  const userId = await getOptionalUserId();
  if (userId) return { owner: "user", userId };

  const guestId = await ensureGuestId();
  return { owner: "guest", guestId };
}

/* -------------------------------------------------------------------------- */
/*  Read helpers                                                               */
/* -------------------------------------------------------------------------- */

function toPrice(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const EMPTY_WISHLIST: WishlistView = {
  items: [],
  count: 0,
  owner: "guest",
  canPersist: true,
};

/**
 * Loads the display payload for a wishlist owner.
 *
 * Uses a single batched `inArray` for variants and images (never a correlated
 * scalar sub-query on a bare single-table select — Drizzle renders unqualified
 * columns there and the sub-query silently binds to the wrong table).
 */
async function loadWishlistView(owner: WishlistOwner): Promise<WishlistView> {
  const ownerCondition =
    owner.owner === "user"
      ? eq(wishlists.userId, owner.userId)
      : eq(wishlists.guestId, owner.guestId);

  const baseRows = await db
    .select({
      id: wishlists.id,
      productId: products.id,
      name: products.name,
      description: products.description,
      categoryName: categories.name,
      categorySlug: categories.slug,
      genderLabel: genders.label,
      genderSlug: genders.slug,
      addedAt: wishlists.addedAt,
    })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(genders, eq(products.genderId, genders.id))
    .where(ownerCondition)
    .orderBy(asc(wishlists.addedAt));

  const productIds = baseRows.map((row) => row.productId);
  if (productIds.length === 0) {
    return { ...EMPTY_WISHLIST, owner: owner.owner };
  }

  const [variantRows, imageRows] = await Promise.all([
    db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        price: productVariants.price,
        salePrice: productVariants.salePrice,
        inStock: productVariants.inStock,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds))
      .orderBy(asc(productVariants.price)),
    db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        isPrimary: productImages.isPrimary,
        sortOrder: productImages.sortOrder,
      })
      .from(productImages)
      .where(inArray(productImages.productId, productIds)),
  ]);

  const priceByProduct = new Map<string, { min: number; max: number }>();
  const defaultVariantByProduct = new Map<string, string>();
  const inStockFallback = new Map<string, string>();
  for (const variant of variantRows) {
    const price = toPrice(variant.salePrice ?? variant.price);
    if (price !== null) {
      const current = priceByProduct.get(variant.productId);
      priceByProduct.set(variant.productId, {
        min: current ? Math.min(current.min, price) : price,
        max: current ? Math.max(current.max, price) : price,
      });
    }
    if (!defaultVariantByProduct.has(variant.productId)) {
      if (variant.inStock > 0) {
        defaultVariantByProduct.set(variant.productId, variant.id);
      } else if (!inStockFallback.has(variant.productId)) {
        inStockFallback.set(variant.productId, variant.id);
      }
    }
  }

  const bestImage = new Map<string, { url: string; score: number }>();
  for (const image of imageRows) {
    const score = (image.isPrimary ? 0 : 100) + image.sortOrder;
    const current = bestImage.get(image.productId);
    if (!current || score < current.score) {
      bestImage.set(image.productId, { url: image.url, score });
    }
  }

  const items: WishlistItemView[] = baseRows.map((row) => {
    const price = priceByProduct.get(row.productId);
    return {
      id: row.id,
      productId: row.productId,
      name: row.name,
      description: row.description,
      categoryName: row.categoryName,
      categorySlug: row.categorySlug,
      genderLabel: row.genderLabel,
      genderSlug: row.genderSlug,
      imageUrl: bestImage.get(row.productId)?.url ?? PLACEHOLDER_IMAGE,
      minPrice: price?.min ?? null,
      maxPrice: price?.max ?? null,
      defaultVariantId:
        defaultVariantByProduct.get(row.productId) ??
        inStockFallback.get(row.productId) ??
        null,
      addedAt: row.addedAt.toISOString(),
    };
  });

  return { items, count: items.length, owner: owner.owner, canPersist: true };
}

/* -------------------------------------------------------------------------- */
/*  Public actions                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetches the current visitor's wishlist (user or guest), or an empty one when
 * none exists yet. SSR-safe: never writes.
 */
export async function getWishlist(): Promise<WishlistView> {
  const owner = await resolveOwnerForRead();
  if (!owner) return EMPTY_WISHLIST;
  return loadWishlistView(owner);
}

/** Adds a product to the wishlist (idempotent), bootstrapping a guest session if needed. */
export async function addToWishlist(productId: string): Promise<WishlistActionResult> {
  if (!productId) {
    return { ok: false, error: "A product is required." };
  }

  try {
    const owner = await resolveOwner();

    const productRows = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.isPublished, true)))
      .limit(1);

    if (!productRows[0]) {
      return { ok: false, error: "That piece is no longer available." };
    }

    // Idempotent: the partial unique indexes guard against duplicates.
    await db
      .insert(wishlists)
      .values(
        owner.owner === "user"
          ? { userId: owner.userId, productId }
          : { guestId: owner.guestId, productId }
      )
      .onConflictDoNothing();

    return { ok: true, wishlist: await loadWishlistView(owner) };
  } catch (error) {
    console.error("Failed to add the item to the wishlist.", error);
    return { ok: false, error: "Unable to save this piece." };
  }
}

/** Removes a product from the wishlist. */
export async function removeFromWishlist(productId: string): Promise<WishlistActionResult> {
  if (!productId) {
    return { ok: false, error: "A product is required." };
  }

  try {
    const owner = await resolveOwner();

    const ownerCondition =
      owner.owner === "user"
        ? eq(wishlists.userId, owner.userId)
        : eq(wishlists.guestId, owner.guestId);

    await db
      .delete(wishlists)
      .where(and(ownerCondition, eq(wishlists.productId, productId)));

    return { ok: true, wishlist: await loadWishlistView(owner) };
  } catch (error) {
    console.error("Failed to remove the item from the wishlist.", error);
    return { ok: false, error: "Unable to remove this piece." };
  }
}

/* -------------------------------------------------------------------------- */
/*  Guest → user merge                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Moves every guest wishlist row into the user's wishlist, ignoring products the
 * user already saved, then deletes the guest rows. Safe to call at any time
 * (e.g. right after sign-in/sign-up); a no-op when there is no guest wishlist or
 * no signed-in user.
 *
 * `explicitUserId` lets the auth actions pass the freshly-authenticated user id
 * directly, since `headers()` may not yet expose the new session cookie within
 * the same request.
 */
export async function mergeGuestWishlistIntoUserWishlist(
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

    const guestItems = await db
      .select({ id: wishlists.id, productId: wishlists.productId })
      .from(wishlists)
      .where(eq(wishlists.guestId, guestRecord.id));

    if (guestItems.length === 0) {
      return { ok: true, merged: false };
    }

    // The Neon HTTP driver does not support interactive transactions, so the
    // merge runs as ordered, idempotent statements: insert each guest product
    // for the user (skipping duplicates), then delete the guest rows.
    const productIds = guestItems.map((item) => item.productId);
    const userExisting = await db
      .select({ productId: wishlists.productId })
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), inArray(wishlists.productId, productIds)));

    const alreadySaved = new Set(userExisting.map((row) => row.productId));
    const toInsert = productIds.filter((productId) => !alreadySaved.has(productId));

    if (toInsert.length > 0) {
      await db
        .insert(wishlists)
        .values(toInsert.map((productId) => ({ userId, productId })))
        .onConflictDoNothing();
    }

    await db.delete(wishlists).where(eq(wishlists.guestId, guestRecord.id));

    return { ok: true, merged: toInsert.length > 0 };
  } catch (error) {
    console.error("Failed to merge the guest wishlist into the user wishlist.", error);
    return { ok: false, merged: false };
  }
}
