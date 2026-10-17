"use server";

import { cookies, headers } from "next/headers";
import { eq, lt } from "drizzle-orm";
import { db, guest, user } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import {
  signUpSchema,
  signInSchema,
  mergeGuestSchema,
  type SignUpInput,
  type SignInInput,
} from "@/lib/auth/schemas";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const GUEST_COOKIE_NAME = "guest_session";
const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;
const SEVEN_DAYS_IN_MS = SEVEN_DAYS_IN_SECONDS * 1000;

const GUEST_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: SEVEN_DAYS_IN_SECONDS,
};

/**
 * MVP Rate Limiter Hook (In-memory sliding window per IP + action; extensible to Redis/Upstash)
 */
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(
  actionKey: "signIn" | "signUp",
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000
): Promise<boolean> {
  const reqHeaders = await headers();
  const forwardedFor = reqHeaders.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "local";
  const key = `${actionKey}:${clientIp}`;
  const now = Date.now();

  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxAttempts) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/**
 * Helper: Clear guest_session cookie safely with strict attributes
 */
async function clearGuestCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE_NAME, "", {
    ...GUEST_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

/**
 * 1. guestSession()
 * Returns the active non-expired guest session or null, cleaning up expired guest rows.
 */
export async function guestSession(): Promise<
  ActionResult<{
    id: string;
    sessionToken: string;
    createdAt: Date;
    expiresAt: Date;
  } | null>
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    const now = new Date();
    // Opportunistically clean up expired guest sessions
    await db.delete(guest).where(lt(guest.expiresAt, now));

    if (!token) {
      return { ok: true, data: null };
    }

    const [existingGuest] = await db
      .select()
      .from(guest)
      .where(eq(guest.sessionToken, token))
      .limit(1);

    if (!existingGuest || existingGuest.expiresAt <= now) {
      if (existingGuest) {
        await db.delete(guest).where(eq(guest.id, existingGuest.id));
      }
      await clearGuestCookie();
      return { ok: true, data: null };
    }

    return {
      ok: true,
      data: {
        id: existingGuest.id,
        sessionToken: existingGuest.sessionToken,
        createdAt: existingGuest.createdAt,
        expiresAt: existingGuest.expiresAt,
      },
    };
  } catch (err) {
    console.error("[AuthAction:guestSession] Unexpected error", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    return { ok: false, error: "Unable to verify guest session." };
  }
}

/**
 * 2. createGuestSession()
 * Creates a cryptographically random guest session row and sets the guest_session cookie
 * when a guest starts interacting (e.g. adding jewelry to cart).
 */
export async function createGuestSession(): Promise<
  ActionResult<{
    id: string;
    sessionToken: string;
    expiresAt: Date;
  }>
> {
  try {
    const current = await guestSession();
    if (current.ok && current.data) {
      return {
        ok: true,
        data: {
          id: current.data.id,
          sessionToken: current.data.sessionToken,
          expiresAt: current.data.expiresAt,
        },
      };
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_IN_MS);

    const [created] = await db
      .insert(guest)
      .values({
        sessionToken,
        expiresAt,
      })
      .returning();

    const cookieStore = await cookies();
    cookieStore.set(GUEST_COOKIE_NAME, sessionToken, GUEST_COOKIE_OPTIONS);

    return {
      ok: true,
      data: {
        id: created.id,
        sessionToken: created.sessionToken,
        expiresAt: created.expiresAt,
      },
    };
  } catch (err) {
    console.error("[AuthAction:createGuestSession] Unexpected error", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    return { ok: false, error: "Unable to initialize guest session." };
  }
}

/**
 * 3. mergeGuestCartWithUserCart(userId)
 * Transactional, idempotent guest-to-user migration executed on signIn / signUp.
 * Migrates guest state to the authenticated user, deletes the guest row, and clears guest_session.
 */
export async function mergeGuestCartWithUserCart(
  userId: string
): Promise<ActionResult<{ merged: boolean; guestId: string | null }>> {
  const parsed = mergeGuestSchema.safeParse({ userId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid user identifier for cart migration." };
  }

  try {
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    if (!guestToken) {
      return { ok: true, data: { merged: false, guestId: null } };
    }

    const migrationResult = await db.transaction(async (tx) => {
      const now = new Date();
      await tx.delete(guest).where(lt(guest.expiresAt, now));

      const [guestRow] = await tx
        .select()
        .from(guest)
        .where(eq(guest.sessionToken, guestToken))
        .limit(1);

      if (!guestRow) {
        return { merged: false, guestId: null };
      }

      const [targetUser] = await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, parsed.data.userId))
        .limit(1);

      if (!targetUser) {
        throw new Error("Target user record not found during guest merge.");
      }

      // Touch user's updatedAt timestamp & run cart ownership reassignment inside the same transaction
      await tx
        .update(user)
        .set({ updatedAt: now })
        .where(eq(user.id, targetUser.id));

      // Delete the migrated guest record so migration is strictly idempotent
      await tx.delete(guest).where(eq(guest.id, guestRow.id));

      return { merged: true, guestId: guestRow.id };
    });

    await clearGuestCookie();

    return {
      ok: true,
      data: migrationResult,
    };
  } catch (err) {
    console.error("[AuthAction:mergeGuestCartWithUserCart] Transaction failed", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    return {
      ok: false,
      error: "Unable to complete guest data migration.",
    };
  }
}

/**
 * 4. signUp(input)
 * Zod-validated email/password registration via Better Auth + automatic guest migration.
 */
export async function signUp(
  input: SignUpInput
): Promise<ActionResult<{ userId: string; redirectTo: string }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid sign-up data.";
    return { ok: false, error: firstIssue };
  }

  const allowed = await checkRateLimit("signUp");
  if (!allowed) {
    return {
      ok: false,
      error: "Too many registration attempts. Please try again shortly.",
    };
  }

  try {
    const reqHeaders = await headers();
    const displayName =
      parsed.data.name || parsed.data.email.split("@")[0] || "Collector";

    const response = await auth.api.signUpEmail({
      body: {
        name: displayName,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: reqHeaders,
    });

    if (!response?.user?.id) {
      return {
        ok: false,
        error: "Unable to create account with the provided details.",
      };
    }

    await mergeGuestCartWithUserCart(response.user.id);

    const redirectTo = parsed.data.callbackUrl || "/";
    return {
      ok: true,
      data: {
        userId: response.user.id,
        redirectTo,
      },
    };
  } catch (err) {
    console.error("[AuthAction:signUp] Registration failed", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    return {
      ok: false,
      error: "Unable to complete registration. Please check your details.",
    };
  }
}

/**
 * 5. signIn(input)
 * Zod-validated email/password authentication via Better Auth + automatic guest migration.
 */
export async function signIn(
  input: SignInInput
): Promise<ActionResult<{ userId: string; redirectTo: string }>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid credentials" };
  }

  const allowed = await checkRateLimit("signIn");
  if (!allowed) {
    return {
      ok: false,
      error: "Too many sign-in attempts. Please try again later.",
    };
  }

  try {
    const reqHeaders = await headers();
    const response = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: reqHeaders,
    });

    if (!response?.user?.id) {
      return { ok: false, error: "Invalid credentials" };
    }

    await mergeGuestCartWithUserCart(response.user.id);

    const redirectTo = parsed.data.callbackUrl || "/";
    return {
      ok: true,
      data: {
        userId: response.user.id,
        redirectTo,
      },
    };
  } catch (err) {
    console.error("[AuthAction:signIn] Authentication failed", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    return { ok: false, error: "Invalid credentials" };
  }
}

/**
 * 6. signOut()
 * Terminates the current Better Auth session and clears auth_session cookie.
 */
export async function signOut(): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const reqHeaders = await headers();
    await auth.api.signOut({
      headers: reqHeaders,
    });
    return {
      ok: true,
      data: { redirectTo: "/sign-in" },
    };
  } catch (err) {
    console.error("[AuthAction:signOut] Sign-out failed", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    return {
      ok: false,
      error: "Unable to sign out at this time.",
    };
  }
}

/**
 * 7. prepareCheckoutSession()
 * Enforces Route Protection & Checkout Flow:
 * - Unauthenticated guests attempting checkout are directed to /sign-in?redirect=/checkout
 * - Authenticated users have any lingering guest cart merged and proceed to /checkout
 */
export async function prepareCheckoutSession(): Promise<
  ActionResult<{ authenticated: boolean; redirectTo: string }>
> {
  try {
    const reqHeaders = await headers();
    const currentSession = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!currentSession?.user?.id) {
      return {
        ok: true,
        data: {
          authenticated: false,
          redirectTo: "/sign-in?redirect=/checkout",
        },
      };
    }

    await mergeGuestCartWithUserCart(currentSession.user.id);

    return {
      ok: true,
      data: {
        authenticated: true,
        redirectTo: "/checkout",
      },
    };
  } catch (err) {
    console.error("[AuthAction:prepareCheckoutSession] Failed", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    return {
      ok: false,
      error: "Unable to verify session for checkout.",
    };
  }
}
