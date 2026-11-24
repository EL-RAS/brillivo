import type { Metadata } from "next";

import { CartView } from "@/components";
import { getCart } from "@/lib/actions/cart";
import { getCurrentUser } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Shopping Bag — Brillivo",
  description: "Review your Brillivo selection and proceed to a secure checkout.",
};

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-silver-200 pb-6">
        <p className="text-footnote uppercase tracking-[0.3em] text-silver-600">Your selection</p>
        <h1 className="mt-3 text-heading-3 text-dark-900 sm:text-heading-2">Shopping Bag</h1>
        <p className="mt-2 text-body text-dark-700">
          Hand-finished 925 sterling silver, reserved for a limited time.
        </p>
        <span className="sr-only" data-initial-count={cart.itemCount} />
      </header>

      <CartView isAuthenticated={Boolean(user)} initialCart={cart} />
    </main>
  );
}
