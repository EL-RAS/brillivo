import type { Metadata } from "next";

import { CheckoutView } from "@/components";
import { getCart } from "@/lib/actions/cart";
import { requireUser } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Checkout — Brillivo",
  description: "Complete your Brillivo order with cash on delivery.",
};

export default async function CheckoutPage() {
  // Middleware protects this route, but the page re-checks the session so a
  // stale cookie can never reach the checkout form.
  await requireUser("/checkout");

  // The server cart is the first paint. Passing it straight into the island
  // fixes the false "Your bag is empty" state and keeps the checkout in sync
  // with the navbar count / merged guest bag.
  const cart = await getCart();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-silver-200 pb-6">
        <p className="text-footnote uppercase tracking-[0.3em] text-silver-600">
          Secure checkout
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-heading-3 text-dark-900 sm:text-heading-2">Checkout</h1>
          <p className="text-caption text-dark-700">
            {cart.itemCount > 0
              ? `${cart.itemCount} ${cart.itemCount === 1 ? "piece" : "pieces"} reserved for you`
              : "Your bag is currently empty"}
          </p>
        </div>
        <p className="mt-2 max-w-2xl text-body text-dark-700">
          Cash on Delivery — confirm your details and pay when your hand-finished sterling
          silver arrives.
        </p>
      </header>

      <CheckoutView initialCart={cart} />
    </main>
  );
}
