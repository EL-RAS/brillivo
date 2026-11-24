"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { useWishlistStore } from "@/store/wishlist.store";

/**
 * The single favorite-heart control, reused across product cards and the PDP.
 *
 * Reads its filled/active state from the wishlist store (so every heart stays
 * in lockstep) and toggles optimistically. Both guests (via `guest_id`) and
 * signed-in users can favourite instantly — no sign-in gate.
 */

const ICON_BASE =
  "inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] disabled:cursor-not-allowed";

type Variant = "overlay" | "inline";

export interface WishlistHeartProps {
  productId: string;
  /** Accessible label context, e.g. the product name. */
  productName?: string;
  variant?: Variant;
  className?: string;
}

export default function WishlistHeart({
  productId,
  productName,
  variant = "overlay",
  className = "",
}: WishlistHeartProps) {
  const wished = useWishlistStore((state) => state.productIds.includes(productId));
  const toggle = useWishlistStore((state) => state.toggle);
  const [pending, setPending] = useState(false);

  const handleToggle = async () => {
    if (pending) return;
    setPending(true);
    await toggle(productId);
    setPending(false);
  };

  const label = `${wished ? "Remove" : "Add"} ${productName ?? "this piece"} ${
    wished ? "from" : "to"
  } wishlist`;

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={wished}
        aria-label={label}
        className={`${ICON_BASE} h-12 w-12 rounded-full border ${
          wished
            ? "border-dark-900 bg-dark-900 text-light-100"
            : "border-light-300 text-dark-900 hover:border-dark-900"
        } ${className}`}
      >
        <Heart aria-hidden="true" className={`h-4 w-4 ${wished ? "fill-light-100" : ""}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={wished}
      aria-label={label}
      className={`${ICON_BASE} absolute right-3 top-3 z-10 h-9 w-9 rounded-full border backdrop-blur ${
        wished
          ? "border-dark-900 bg-dark-900 text-light-100"
          : "border-light-300/70 bg-light-100/85 text-dark-900 hover:bg-light-100"
      } ${className}`}
    >
      <Heart aria-hidden="true" className={`h-4 w-4 ${wished ? "fill-light-100" : ""}`} />
    </button>
  );
}
