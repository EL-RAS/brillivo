"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type ComponentPropsWithoutRef,
  type FormEvent,
} from "react";
import {
  Banknote,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import type { CartView as CartViewData } from "@/lib/actions/cart";
import { createCodOrder, type CheckoutField, type CodOrderResult } from "@/lib/actions/order";
import { formatMoney } from "@/lib/utils/order";
import { useCartStore } from "@/store/cart.store";

/**
 * Cash-on-delivery checkout island.
 *
 * The server-rendered `initialCart` is the first paint (so a user with a bag
 * never sees a false empty state), then the store is hydrated from that same
 * snapshot and becomes the live view. Placing the order runs the COD server
 * action, clears the local bag and forwards to the confirmation page.
 */

const FIELD_CLASS =
  "w-full rounded-xl border border-silver-300 bg-light-100 px-4 py-3 text-body text-dark-900 transition-colors placeholder:text-silver-500 focus:border-silver-500 focus:outline-none focus:ring-2 focus:ring-silver-300 disabled:cursor-not-allowed disabled:opacity-60";

const LABEL_CLASS = "text-footnote uppercase tracking-[0.18em] text-silver-600";

const ERROR_FIELD_CLASS = "border-red focus:border-red focus:ring-red/20";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-footnote text-red">
      {message}
    </p>
  );
}

type TextFieldProps = {
  label: string;
  name: CheckoutField;
  error?: string;
  hint?: string;
  optional?: boolean;
} & Omit<ComponentPropsWithoutRef<"input">, "name" | "id">;

function TextField({
  label,
  name,
  error,
  hint,
  optional = false,
  className = "",
  ...props
}: TextFieldProps) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
        {optional && (
          <span className="ml-1.5 normal-case tracking-normal text-silver-500">(optional)</span>
        )}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${FIELD_CLASS} ${error ? ERROR_FIELD_CLASS : ""} ${className}`}
        {...props}
      />
      {error ? (
        <FieldError id={errorId} message={error} />
      ) : hint ? (
        <p id={hintId} className="text-footnote text-silver-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  name: CheckoutField;
  error?: string;
  hint?: string;
} & Omit<ComponentPropsWithoutRef<"textarea">, "name" | "id">;

function TextAreaField({
  label,
  name,
  error,
  hint,
  className = "",
  ...props
}: TextAreaFieldProps) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
        <span className="ml-1.5 normal-case tracking-normal text-silver-500">(optional)</span>
      </label>
      <textarea
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${FIELD_CLASS} min-h-24 resize-y ${error ? ERROR_FIELD_CLASS : ""} ${className}`}
        {...props}
      />
      {error ? (
        <FieldError id={errorId} message={error} />
      ) : hint ? (
        <p id={hintId} className="text-footnote text-silver-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function CheckoutView({ initialCart }: { initialCart: CartViewData }) {
  const router = useRouter();
  const hydrate = useCartStore((state) => state.hydrate);
  const storeItems = useCartStore((state) => state.items);
  const storeItemCount = useCartStore((state) => state.itemCount);
  const storeSubtotal = useCartStore((state) => state.subtotal);

  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CodOrderResult | null>(null);

  useEffect(() => {
    // Mirror the server snapshot into Zustand (navbar badge, cart page, etc.).
    hydrate(initialCart);
    setMounted(true);
  }, [hydrate, initialCart]);

  const items = mounted ? storeItems : initialCart.items;
  const itemCount = mounted ? storeItemCount : initialCart.itemCount;
  const subtotal = mounted ? storeSubtotal : initialCart.subtotal;
  const total = subtotal; // Shipping is complimentary on every Brillivo order.
  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    setResult(null);

    startTransition(async () => {
      const response = await createCodOrder(formData);

      if (!response.ok) {
        setResult(response);
        return;
      }

      hydrate({ items: [], itemCount: 0, subtotal: 0, owner: "user" });
      router.push(`/checkout/success?orderId=${encodeURIComponent(response.orderId)}`);
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-silver-200 bg-light-100 px-6 py-16 text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-light-300 bg-light-200 text-silver-600">
          <ShoppingBag className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-heading-3 text-dark-900">Your bag is empty</h2>
        <p className="mx-auto mt-2 max-w-sm text-body text-dark-700">
          Add a hand-finished sterling silver piece to your bag before proceeding to checkout.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-dark-900 px-8 text-caption uppercase tracking-[0.22em] text-light-100 transition-colors hover:bg-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2"
        >
          Explore the collection
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending}
      className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-14"
    >
      <div className="flex flex-col gap-8">
        {result && !result.ok && (
          <p
            role="alert"
            className="rounded-xl border border-red/30 bg-red/5 px-4 py-3 text-caption text-red"
          >
            {result.error}
          </p>
        )}

        {/* Shipping details */}
        <section
          aria-labelledby="shipping-heading"
          className="rounded-2xl border border-silver-200 bg-light-100 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 border-b border-silver-200 pb-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-silver-200 bg-silver-100 text-silver-700">
              <MapPin className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-footnote uppercase tracking-[0.3em] text-silver-600">
                Step 01
              </p>
              <h2 id="shipping-heading" className="text-body-medium text-dark-900">
                Shipping details
              </h2>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              label="Full name"
              name="fullName"
              autoComplete="name"
              placeholder="Alex Morgan"
              error={fieldErrors?.fullName}
            />
            <TextField
              label="Phone number"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+962 788888888"
              error={fieldErrors?.phone}
            />
            <TextField
              label="Street address"
              name="streetAddress"
              autoComplete="address-line1"
              placeholder="Istiklal ST."
              error={fieldErrors?.streetAddress}
              className="sm:col-span-2"
            />
            <TextField
              label="Building / apartment"
              name="building"
              autoComplete="address-line2"
              placeholder="4B"
              optional
              error={fieldErrors?.building}
            />
            <TextField
              label="City"
              name="city"
              autoComplete="address-level2"
              placeholder="Amman"
              error={fieldErrors?.city}
            />
            <TextField
              label="Postal code"
              name="postalCode"
              autoComplete="postal-code"
              placeholder="10001"
              error={fieldErrors?.postalCode}
            />
            <TextField
              label="Country"
              name="country"
              autoComplete="country-name"
              defaultValue="Jordan"
              error={fieldErrors?.country}
            />
            <TextAreaField
              label="Delivery notes"
              name="deliveryNotes"
              rows={3}
              placeholder="Concierge hours, gate code, or a gift note."
              error={fieldErrors?.deliveryNotes}
            />
          </div>
        </section>

        {/* Payment method */}
        <section
          aria-labelledby="payment-heading"
          className="rounded-2xl border border-silver-200 bg-light-100 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 border-b border-silver-200 pb-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-silver-200 bg-silver-100 text-silver-700">
              <Banknote className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-footnote uppercase tracking-[0.3em] text-silver-600">
                Step 02
              </p>
              <h2 id="payment-heading" className="text-body-medium text-dark-900">
                Payment method
              </h2>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="payment-cod"
              className="flex cursor-default items-start gap-4 rounded-2xl border border-dark-900 bg-silver-100/70 p-5"
            >
              <input
                id="payment-cod"
                type="radio"
                name="paymentMethod"
                value="cod"
                defaultChecked
                className="sr-only"
              />
              <span className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-light-100 text-dark-900 ring-1 ring-silver-200">
                <Banknote className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-body-medium text-dark-900">Cash on Delivery</span>
                  <span className="rounded-full bg-dark-900 px-2.5 py-0.5 text-footnote uppercase tracking-[0.16em] text-light-100">
                    Selected
                  </span>
                </span>
                <span className="mt-1 block text-caption text-dark-700">
                  Pay in cash when your Brillivo piece arrives. No card is charged online.
                </span>
              </span>
              <CheckCircle2
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-dark-900"
                aria-hidden="true"
              />
            </label>

            <p className="mt-4 flex items-start gap-2 text-footnote text-dark-700">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-silver-600"
                aria-hidden="true"
              />
              Your details are used only to deliver this order. Please have the exact total ready
              for the courier.
            </p>
          </div>
        </section>
      </div>

      {/* Order summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-silver-200 bg-light-100 p-6">
          <div className="flex items-baseline justify-between gap-3 border-b border-silver-200 pb-4">
            <h2 className="text-body-medium text-dark-900">Order summary</h2>
            <span className="text-footnote uppercase tracking-[0.18em] text-silver-600">
              {itemCount} {itemCount === 1 ? "piece" : "pieces"}
            </span>
          </div>

          <ul className="mt-5 flex flex-col gap-4">
            {items.map((item) => {
              const variantLabel = [item.color?.name, item.size?.name]
                .filter(Boolean)
                .join(" · ");

              return (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-light-200">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-silver-500">
                        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption text-dark-900">{item.productName}</p>
                    {variantLabel && (
                      <p className="mt-0.5 truncate text-footnote text-dark-700">{variantLabel}</p>
                    )}
                    <p className="mt-1 text-footnote text-dark-700">
                      Qty {item.quantity} · {formatMoney(item.unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0 text-caption text-dark-900">
                    {formatMoney(item.lineTotal)}
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="mt-6 flex flex-col gap-3 border-t border-silver-200 pt-5 text-body">
            <div className="flex items-center justify-between">
              <dt className="text-dark-700">Subtotal</dt>
              <dd className="text-dark-900">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-dark-700">Shipping</dt>
              <dd className="text-dark-900">Complimentary</dd>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-silver-200 pt-4">
              <dt className="text-body-medium text-dark-900">Total</dt>
              <dd className="text-lead text-dark-900">{formatMoney(total)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-dark-900 text-caption uppercase tracking-[0.22em] text-light-100 transition-colors hover:bg-silver-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Placing order
              </>
            ) : (
              "Place order"
            )}
          </button>

          <p className="mt-3 text-center text-footnote text-dark-700">
            Cash on delivery · {formatMoney(total)} due on arrival
          </p>

          <ul className="mt-5 flex flex-col gap-2.5 border-t border-silver-200 pt-5 text-footnote text-dark-700">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 flex-shrink-0 text-silver-600" aria-hidden="true" />
              Complimentary insured delivery
            </li>
            <li className="flex items-center gap-2">
              <Banknote className="h-4 w-4 flex-shrink-0 text-silver-600" aria-hidden="true" />
              Pay in cash when it arrives
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck
                className="h-4 w-4 flex-shrink-0 text-silver-600"
                aria-hidden="true"
              />
              30-day returns, no questions asked
            </li>
          </ul>
        </div>

        <Link
          href="/cart"
          className="mt-4 block text-center text-caption uppercase tracking-[0.18em] text-silver-600 transition-colors hover:text-dark-900"
        >
          Back to shopping bag
        </Link>
      </aside>
    </form>
  );
}
