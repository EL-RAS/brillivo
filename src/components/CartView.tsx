"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";

import type { CartView as CartViewData } from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";

/**
 * Interactive cart body. Renders the live Zustand cart and dispatches the
 * server-backed mutations. Guests are routed to sign-in before checkout so the
 * guest cart can be merged into their account on the way through.
 *
 * The store starts empty on both server and client, so the SSR markup renders
 * from the `initialCart` snapshot; once mounted, the store becomes the single
 * source of truth and reflects every subsequent mutation.
 */

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

const FREE_SHIPPING_THRESHOLD = 150;

export default function CartView({
  isAuthenticated,
  initialCart,
}: {
  isAuthenticated: boolean;
  initialCart: CartViewData;
}) {
  const router = useRouter();
  const storeItems = useCartStore((state) => state.items);
  const storeSubtotal = useCartStore((state) => state.subtotal);
  const status = useCartStore((state) => state.status);
  const error = useCartStore((state) => state.error);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  // Track mount so the very first (SSR + hydration) render uses the server
  // snapshot, avoiding a flash of "empty bag" before the store hydrates.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Pull fresh state (e.g. right after a guest→user merge on sign-in).
    void useCartStore.getState().refresh();
  }, []);

  const items = mounted ? storeItems : initialCart.items;
  const subtotal = mounted ? storeSubtotal : initialCart.subtotal;

  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const busy = status === "loading";
  const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? 9.95 : 0;
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleCheckout = () => {
    if (isAuthenticated) {
      router.push("/checkout");
      return;
    }
    router.push("/sign-in?redirect=%2Fcheckout");
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-silver-200 bg-light-100 px-6 py-16 text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-light-300 bg-light-200 text-silver-600">
          <ShoppingBag className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-heading-3 text-dark-900">Your bag is empty</h2>
        <p className="mx-auto mt-2 max-w-sm text-body text-dark-700">
          Discover hand-finished sterling silver pieces and add your favourites to the bag.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-dark-900 px-8 text-caption uppercase tracking-[0.22em] text-light-100 transition-colors hover:bg-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
      {/* Items */}
      <section aria-label="Bag items" className="flex flex-col">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-(--color-red)/30 bg-(--color-red)/5 px-4 py-3 text-caption text-[--color-red]"
          >
            {error}
          </p>
        )}

        <ul className="flex flex-col divide-y divide-silver-200 border-y border-silver-200">
          {items.map((item) => {
            const lineBusy = busy || pendingItemId === item.id;
            return (
              <li key={item.id} className="flex gap-4 py-5 sm:gap-6">
                <Link
                  href={`/products/${item.productId}`}
                  className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-light-200 sm:h-32 sm:w-28"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-silver-600">
                      <ShoppingBag className="h-6 w-6" aria-hidden="true" />
                    </span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-body-medium text-dark-900 transition-colors hover:text-silver-700"
                      >
                        {item.productName}
                      </Link>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-dark-700">
                        {item.color && (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="inline-block h-3 w-3 rounded-full ring-1 ring-inset ring-black/10"
                              style={{ backgroundColor: item.color.hexCode }}
                              aria-hidden="true"
                            />
                            {item.color.name}
                          </span>
                        )}
                        {item.size && <span>Size · {item.size.name}</span>}
                      </div>

                      {item.inStock <= 0 && (
                        <p className="mt-1 text-caption text-[--color-red]">Out of stock</p>
                      )}
                    </div>

                    <p className="shrink-0 text-body-medium text-dark-900">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Quantity stepper */}
                    <div className="inline-flex items-center rounded-full border border-silver-300">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={lineBusy || item.quantity <= 1}
                        onClick={() => {
                          setPendingItemId(item.id);
                          void updateQuantity(item.id, item.quantity - 1).finally(() =>
                            setPendingItemId(null)
                          );
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-dark-900 transition-colors hover:bg-light-200 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span
                        className="w-8 text-center text-caption text-dark-900"
                        aria-live="polite"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={lineBusy || (item.inStock > 0 && item.quantity >= item.inStock)}
                        onClick={() => {
                          setPendingItemId(item.id);
                          void updateQuantity(item.id, item.quantity + 1).finally(() =>
                            setPendingItemId(null)
                          );
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-dark-900 transition-colors hover:bg-light-200 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${item.productName} from bag`}
                      disabled={lineBusy}
                      onClick={() => {
                        setPendingItemId(item.id);
                        void removeItem(item.id).finally(() => setPendingItemId(null));
                      }}
                      className="inline-flex items-center gap-1.5 text-caption text-dark-700 transition-colors hover:text-[--color-red] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-4">
          <Link
            href="/products"
            className="text-caption uppercase tracking-[0.18em] text-silver-600 transition-colors hover:text-dark-900"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void clear()}
            className="inline-flex items-center gap-1.5 text-caption text-dark-700 transition-colors hover:text-[--color-red] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear bag
          </button>
        </div>
      </section>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-silver-200 bg-light-100 p-6">
          <h2 className="text-body-medium text-dark-900">Order summary</h2>

          <dl className="mt-5 flex flex-col gap-3 text-body">
            <div className="flex items-center justify-between">
              <dt className="text-dark-700">Subtotal</dt>
              <dd className="text-dark-900">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-dark-700">Shipping</dt>
              <dd className="text-dark-900">
                {shipping === 0 ? "Complimentary" : formatPrice(shipping)}
              </dd>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-silver-200 pt-3">
              <dt className="text-body-medium text-dark-900">Total</dt>
              <dd className="text-lead text-dark-900">{formatPrice(total)}</dd>
            </div>
          </dl>

          {remainingForFreeShipping > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-light-200 px-3 py-2.5 text-caption text-dark-700">
              <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-silver-600" aria-hidden="true" />
              Add {formatPrice(remainingForFreeShipping)} more for complimentary shipping.
            </p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={handleCheckout}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-dark-900 text-caption uppercase tracking-[0.22em] text-light-100 transition-colors hover:bg-silver-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2"
          >
            {isAuthenticated ? "Proceed to checkout" : "Sign in to checkout"}
          </button>

          {!isAuthenticated && (
            <p className="mt-3 text-center text-footnote text-dark-700">
              Your bag will be saved and moved to your account after you sign in.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
