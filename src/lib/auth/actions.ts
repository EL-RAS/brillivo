"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, lt, notExists } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carts, guest, wishlists } from "@/lib/db/schema";
import { mergeGuestCartIntoUserCart } from "@/lib/actions/cart";
import { mergeGuestWishlistIntoUserWishlist } from "@/lib/actions/wishlist";
import {
  signInSchema,
  signUpSchema,
  guestSessionSchema,
  firstIssueMessage,
  sanitizeRedirect,
  type AuthActionResult,
  type CreateGuestSessionResult,
  type GuestSessionResult,
} from "@/lib/auth/validation";

const GUEST_COOKIE_NAME = "guest_session";
const GUEST_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const GUEST_COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/" as const,
  maxAge: GUEST_SESSION_MAX_AGE_SECONDS,
};

function formValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function resolveAuthError(error: unknown, fallback: string): string {
  if (error instanceof APIError) {
    const message = error.body?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}

function buildSignInUrl(redirectTo: string): string {
  const params = new URLSearchParams({ redirect: redirectTo });
  return `/sign-in?${params.toString()}`;
}

/**
 * Migrates every guest-owned resource (cart + wishlist) into the freshly
 * authenticated user, then removes the guest row and cookie exactly once.
 *
 * The guest token is read a single time up-front and passed explicitly to each
 * merge so that no merge depends on the cookie still being present after
 * another one has run (the cookie store reflects one deletion across the
 * request, and deleting the guest row cascades its dependent rows).
 */
async function mergeGuestDataIntoUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  await mergeGuestCartIntoUserCart(userId, token);
  await mergeGuestWishlistIntoUserWishlist(userId, token);

  cookieStore.delete(GUEST_COOKIE_NAME);

  if (!token) return;

  const guestRows = await db
    .select({ id: guest.id })
    .from(guest)
    .where(eq(guest.sessionToken, token))
    .limit(1);

  const guestRecord = guestRows[0];
  if (!guestRecord) return;

  // Only drop the guest row when it no longer owns a cart or wishlist row, so a
  // partially-failed merge can't cascade away data that still needs migrating.
  const remaining = await db
    .select({ id: guest.id })
    .from(guest)
    .where(
      and(
        eq(guest.id, guestRecord.id),
        notExists(
          db.select({ id: carts.id }).from(carts).where(eq(carts.guestId, guestRecord.id))
        ),
        notExists(
          db
            .select({ id: wishlists.id })
            .from(wishlists)
            .where(eq(wishlists.guestId, guestRecord.id))
        )
      )
    )
    .limit(1);

  if (remaining[0]) {
    await db.delete(guest).where(eq(guest.id, guestRecord.id));
  }
}

function isDynamicUsageError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
  } catch (error) {
    if (isDynamicUsageError(error)) {
      throw error;
    }

    console.error("Failed to resolve the current user.", error);
    return null;
  }
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(redirectTo = "/"): Promise<CurrentUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(buildSignInUrl(sanitizeRedirect(redirectTo)));
  }

  return currentUser;
}

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse({
    name: formValue(formData, "name") ?? "",
    email: formValue(formData, "email") ?? "",
    password: formValue(formData, "password") ?? "",
    redirectTo: formValue(formData, "redirectTo"),
  });

  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error, "Invalid sign-up details.") };
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    await mergeGuestDataIntoUser(result.user.id);

    return {
      ok: true,
      userId: result.user.id,
      redirectTo: sanitizeRedirect(parsed.data.redirectTo),
    };
  } catch (error) {
    console.error("Sign-up failed.", error);
    return { ok: false, error: resolveAuthError(error, "Unable to create your account.") };
  }
}

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse({
    email: formValue(formData, "email") ?? "",
    password: formValue(formData, "password") ?? "",
    redirectTo: formValue(formData, "redirectTo"),
  });

  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error, "Invalid sign-in details.") };
  }

  try {
    const result = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    await mergeGuestDataIntoUser(result.user.id);

    return {
      ok: true,
      userId: result.user.id,
      redirectTo: sanitizeRedirect(parsed.data.redirectTo),
    };
  } catch (error) {
    console.error("Sign-in failed.", error);
    return { ok: false, error: resolveAuthError(error, "Invalid email or password.") };
  }
}

export async function signOut(): Promise<{ ok: boolean }> {
  await auth.api.signOut({ headers: await headers() });
  return { ok: true };
}

export async function createGuestSession(): Promise<CreateGuestSessionResult> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (existingToken) {
    const activeToken = await findActiveGuestToken(existingToken);
    if (activeToken) {
      return { ok: true, sessionToken: activeToken };
    }
  }

  await db.delete(guest).where(lt(guest.expiresAt, new Date()));

  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + GUEST_SESSION_MAX_AGE_SECONDS * 1000);

  await db.insert(guest).values({ sessionToken, expiresAt });
  cookieStore.set(GUEST_COOKIE_NAME, sessionToken, GUEST_COOKIE_OPTIONS);

  return { ok: true, sessionToken };
}

export async function guestSession(): Promise<GuestSessionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (!token) {
    return { sessionToken: null };
  }

  const parsed = guestSessionSchema.safeParse({ sessionToken: token });
  if (!parsed.success) {
    cookieStore.delete(GUEST_COOKIE_NAME);
    return { sessionToken: null };
  }

  const activeToken = await findActiveGuestToken(token);
  if (!activeToken) {
    await db.delete(guest).where(eq(guest.sessionToken, token));
    cookieStore.delete(GUEST_COOKIE_NAME);
    return { sessionToken: null };
  }

  return { sessionToken: activeToken };
}

export async function mergeGuestCartWithUserCart(): Promise<{ ok: boolean; merged: boolean }> {
  return mergeGuestCartIntoUserCart();
}

async function findActiveGuestToken(sessionToken: string): Promise<string | null> {
  const rows = await db
    .select({ expiresAt: guest.expiresAt })
    .from(guest)
    .where(eq(guest.sessionToken, sessionToken))
    .limit(1);

  const record = rows[0];
  if (!record || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return sessionToken;
}
