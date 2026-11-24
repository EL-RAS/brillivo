import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Banknote, CheckCircle2, MapPin, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

import { getOrderConfirmation } from "@/lib/actions/order";
import { requireUser } from "@/lib/auth/actions";
import { formatMoney } from "@/lib/utils/order";

export const metadata: Metadata = {
  title: "Order Confirmed — Brillivo",
  description: "Your Brillivo cash-on-delivery order is confirmed.",
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ orderId?: string | string[] }>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  await requireUser("/checkout/success");

  const params = await searchParams;
  const orderId = typeof params.orderId === "string" ? params.orderId : undefined;

  if (!orderId) {
    redirect("/checkout");
  }

  const order = await getOrderConfirmation(orderId);
  if (!order) {
    notFound();
  }

  const firstName = order.shipping.fullName.split(" ")[0] || "";
  const addressLines = [
    order.shipping.line1,
    order.shipping.building,
    [order.shipping.city, order.shipping.postalCode].filter(Boolean).join(", "),
    order.shipping.country,
  ].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-green/20 bg-green/10 text-green">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-footnote uppercase tracking-[0.3em] text-silver-600">
          Order confirmed
        </p>
        <h1 className="mt-3 text-heading-3 text-dark-900 sm:text-heading-2">
          Thank you{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-body text-dark-700">
          Your Brillivo order{" "}
          <span className="text-body-medium text-dark-900">{order.orderNumber}</span> has been
          received. We&apos;ll prepare it by hand and send a dispatch note shortly.
        </p>
        <p className="mt-1 text-footnote text-silver-600">Placed {formatDate(order.createdAt)}</p>
        <span className="sr-only" data-order-id={order.orderId} />
      </div>

      {/* Order summary */}
      <section
        aria-labelledby="summary-heading"
        className="mt-10 rounded-2xl border border-silver-200 bg-light-100 p-6 sm:p-8"
      >
        <div className="flex items-baseline justify-between gap-3 border-b border-silver-200 pb-4">
          <h2 id="summary-heading" className="text-body-medium text-dark-900">
            Your order
          </h2>
          <span className="text-footnote uppercase tracking-[0.18em] text-silver-600">
            {order.items.length} {order.items.length === 1 ? "piece" : "pieces"}
          </span>
        </div>

        <ul className="mt-5 flex flex-col divide-y divide-silver-200">
          {order.items.map((item) => {
            const variantLabel = [item.color?.name, item.size?.name]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
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
                  <p className="text-caption text-dark-900">{item.productName}</p>
                  {variantLabel && (
                    <p className="mt-0.5 text-footnote text-dark-700">{variantLabel}</p>
                  )}
                  <p className="mt-1 text-footnote text-dark-700">
                    Qty {item.quantity} · {formatMoney(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-caption text-dark-900">{formatMoney(item.lineTotal)}</p>
              </li>
            );
          })}
        </ul>

        <dl className="mt-6 flex flex-col gap-3 border-t border-silver-200 pt-5 text-body">
          <div className="flex items-center justify-between">
            <dt className="text-dark-700">Subtotal</dt>
            <dd className="text-dark-900">{formatMoney(order.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-dark-700">Shipping</dt>
            <dd className="text-dark-900">Complimentary</dd>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-silver-200 pt-4">
            <dt className="text-body-medium text-dark-900">Total</dt>
            <dd className="text-lead text-dark-900">{formatMoney(order.total)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Delivery */}
        <section
          aria-labelledby="delivery-heading"
          className="rounded-2xl border border-silver-200 bg-light-100 p-6"
        >
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4.5 w-4.5 text-silver-600" aria-hidden="true" />
            <h2 id="delivery-heading" className="text-body-medium text-dark-900">
              Delivery
            </h2>
          </div>
          <address className="mt-4 not-italic text-caption text-dark-700">
            {order.shipping.fullName && (
              <p className="text-dark-900">{order.shipping.fullName}</p>
            )}
            {order.shipping.phone && <p>{order.shipping.phone}</p>}
            {addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>
          {order.shipping.notes && (
            <p className="mt-3 border-t border-silver-200 pt-3 text-footnote text-silver-600">
              Notes: {order.shipping.notes}
            </p>
          )}
          <p className="mt-4 flex items-center gap-2 text-footnote text-dark-700">
            <Truck className="h-4 w-4 flex-shrink-0 text-silver-600" aria-hidden="true" />
            Complimentary insured delivery
          </p>
        </section>

        {/* Payment */}
        <section
          aria-labelledby="payment-heading"
          className="rounded-2xl border border-silver-200 bg-light-100 p-6"
        >
          <div className="flex items-center gap-2.5">
            <Banknote className="h-4.5 w-4.5 text-silver-600" aria-hidden="true" />
            <h2 id="payment-heading" className="text-body-medium text-dark-900">
              Payment
            </h2>
          </div>
          <p className="mt-4 text-caption text-dark-700">Cash on Delivery</p>
          <p className="mt-1 text-body-medium text-dark-900">
            {formatMoney(order.total)} due on arrival
          </p>
          <p className="mt-1 text-footnote text-silver-600">
            {order.paymentStatus === "completed" ? "Payment received" : "Payment pending delivery"}
          </p>
          <p className="mt-4 flex items-start gap-2 border-t border-silver-200 pt-3 text-footnote text-dark-700">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-silver-600"
              aria-hidden="true"
            />
            Please have the exact amount ready for the courier.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <Link
          href="/products"
          className="inline-flex h-12 items-center justify-center rounded-full bg-dark-900 px-8 text-caption uppercase tracking-[0.22em] text-light-100 transition-colors hover:bg-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2"
        >
          Continue shopping
        </Link>
        <p className="text-center text-footnote text-silver-600">
          Keep your order reference{" "}
          <span className="text-dark-700">{order.orderNumber}</span> for any questions.
        </p>
      </div>
    </main>
  );
}
