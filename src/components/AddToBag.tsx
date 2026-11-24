"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";

import WishlistHeart from "./WishlistHeart";
import { useCartStore } from "@/store/cart.store";

/**
 * PDP purchase island (client).
 *
 * Owns the finish + size selection and resolves it to a concrete variant id,
 * then dispatches `addItem` on the cart store (which calls the server action).
 * The gallery keeps its own visual finish selector; this island is the single
 * source of truth for what actually goes into the bag.
 */

export type FinishOption = { slug: string; name: string; hexCode: string };

export type PurchaseVariant = {
  id: string;
  colorSlug: string | null;
  sizeSlug: string | null;
  inStock: number;
};

export interface AddToBagProps {
  productId: string;
  /** Product name, used for accessible labels on the wishlist heart. */
  productName?: string;
  variants: PurchaseVariant[];
  finishes: FinishOption[];
  sizes: { slug: string; name: string }[];
  sizeLabel: string;
  /** Whether the product has any purchasable stock at all. */
  inStock: boolean;
}

export default function AddToBag({
  productId,
  productName,
  variants,
  finishes,
  sizes,
  sizeLabel,
  inStock,
}: AddToBagProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [finishSlug, setFinishSlug] = useState<string | null>(finishes[0]?.slug ?? null);
  const [sizeSlug, setSizeSlug] = useState<string | null>(
    sizes.length === 1 ? sizes[0].slug : null
  );
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const needsFinish = finishes.length > 1;
  const needsSize = sizes.length > 1;

  const selectedVariant = variants.find(
    (variant) =>
      (!needsFinish || variant.colorSlug === finishSlug) &&
      (!needsSize || variant.sizeSlug === sizeSlug)
  );

  const selectionComplete = Boolean(selectedVariant);
  const canAdd = inStock && selectionComplete && status !== "adding";

  const handleAdd = async () => {
    if (!selectedVariant) {
      setStatus("error");
      setMessage(needsSize ? `Please select a ${sizeLabel.toLowerCase()}.` : "Select your finish.");
      return;
    }

    setStatus("adding");
    setMessage(null);

    const ok = await addItem(selectedVariant.id, 1);
    if (ok) {
      setStatus("added");
      setMessage("Added to your bag.");
      window.setTimeout(() => setStatus("idle"), 2500);
    } else {
      setStatus("error");
      setMessage("Unable to add this piece. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Finish selector */}
      {needsFinish && (
        <div className="flex flex-col gap-3">
          <p className="text-caption uppercase tracking-[0.28em] text-silver-600">Finish / Plating</p>
          <div className="flex flex-wrap gap-3">
            {finishes.map((finish) => {
              const isActive = finish.slug === finishSlug;
              return (
                <button
                  key={finish.slug}
                  type="button"
                  onClick={() => setFinishSlug(finish.slug)}
                  aria-pressed={isActive}
                  className={`group inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 ${
                    isActive ? "border-dark-900 bg-light-100" : "border-light-300 hover:border-silver-400"
                  }`}
                >
                  <span
                    className="relative inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: finish.hexCode }}
                    aria-hidden="true"
                  >
                    {isActive && <Check className="h-4 w-4 text-dark-900 drop-shadow" />}
                  </span>
                  <span className="text-caption text-dark-900">{finish.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      {needsSize && (
        <div className="flex flex-col gap-3">
          <p className="text-body-medium text-dark-900">{sizeLabel}</p>
          <div role="radiogroup" aria-label={sizeLabel} className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {sizes.map((size) => {
              const isActive = size.slug === sizeSlug;
              const available = variants.some(
                (variant) =>
                  variant.sizeSlug === size.slug &&
                  (!needsFinish || variant.colorSlug === finishSlug) &&
                  variant.inStock > 0
              );
              return (
                <button
                  key={size.slug}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  disabled={!available}
                  onClick={() => setSizeSlug(size.slug)}
                  className={`rounded-lg border px-2 py-3 text-center text-body transition focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 disabled:cursor-not-allowed disabled:border-light-300 disabled:text-silver-400 disabled:line-through ${
                    isActive
                      ? "border-dark-900 text-dark-900"
                      : "border-light-300 text-dark-700 hover:border-silver-400"
                  }`}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!canAdd}
          onClick={handleAdd}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-dark-900 text-body-medium text-light-100 transition-colors hover:bg-silver-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2"
        >
          {status === "added" ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Added
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {status === "adding" ? "Adding…" : inStock ? "Add to Bag" : "Out of stock"}
            </>
          )}
        </button>
        <WishlistHeart productId={productId} productName={productName} variant="inline" />
      </div>

      {message && (
        <p
          role="status"
          className={`text-caption ${
            status === "error" ? "text-[--color-red]" : "text-[--color-green]"
          }`}
        >
          {message}
        </p>
      )}

      <Link
        href="/cart"
        className="text-caption uppercase tracking-[0.18em] text-silver-600 transition-colors hover:text-dark-900"
      >
        View bag
      </Link>
    </div>
  );
}
