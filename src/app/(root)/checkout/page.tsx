import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { mergeGuestCartWithUserCart } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const reqHeaders = await headers();
  const currentSession = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!currentSession?.user?.id) {
    redirect("/sign-in?redirect=/checkout");
  }

  // Ensure any remaining guest_session cart items are merged idempotently
  await mergeGuestCartWithUserCart(currentSession.user.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 font-jost text-[var(--dark)]">
      <div className="rounded-2xl border border-[var(--gray)] bg-[var(--light)] p-8 sm:p-12 shadow-sm">
        <p className="text-caption font-medium uppercase tracking-[0.2em] text-[var(--agua)]">
          Authenticated Collector Checkout
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--dark)]">
          Welcome, {currentSession.user.name || currentSession.user.email}
        </h1>
        <p className="mt-3 text-body text-[var(--dark)]/70">
          Your guest session has been merged with your Brillivo collector
          account, and your hallmarked jewelry selection is ready for insured
          vault dispatch.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[var(--dark)] px-7 py-3.5 text-body-medium font-medium text-[var(--light)] transition-colors hover:bg-[var(--agua)] hover:text-[var(--dark)]"
          >
            Continue Browsing Collection
          </Link>
        </div>
      </div>
    </main>
  );
}
