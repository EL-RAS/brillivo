"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";

import Card from "./Card";
import type { WishlistView as WishlistData } from "@/lib/actions/wishlist";
import { useWishlistStore } from "@/store/wishlist.store";

/**
 * Interactive wishlist body.
 *
 * Renders the live Zustand wishlist as a responsive grid of {@link Card}s, each
 * carrying an active heart that removes the piece. Signed-out visitors see a
 * sign-in call-to-action; signed-in users with nothing saved see a browse CTA.
 *
 * The store starts empty on both server and client, so the SSR markup renders
 * from the `initialWishlist` snapshot; once mounted, the store becomes the
 * single source of truth.
 */

function formatPrice(minPrice: number | null, maxPrice: number | null): string | undefined {
  if (minPrice === null && maxPrice === null) return undefined;
  if (minPrice !== null && maxPrice !== null && minPrice !== maxPrice) {
    return `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`;
  }
  return `$${(minPrice ?? maxPrice ?? 0).toFixed(2)}`;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-light-300 bg-light-100 px-6 py-20 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-light-300 bg-light-200 text-silver-600">
        <Heart className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-heading-3 text-dark-900">Your wishlist is empty</h2>
      <p className="mt-3 max-w-md text-body text-dark-700">
        Tap the heart on any piece to keep it here for later. Your selection is saved
        automatically — no account required.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className="inline-flex h-12 items-center justify-center rounded-full bg-dark-900 px-8 text-body-medium text-light-100 transition-colors hover:bg-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2"
        >
          Browse jewelry
        </Link>
      </div>
    </div>
  );
}

export default function WishlistView({ initialWishlist }: { initialWishlist: WishlistData }) {
  const storeItems = useWishlistStore((state) => state.items);
  const status = useWishlistStore((state) => state.status);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void useWishlistStore.getState().refresh();
  }, []);

  const items = mounted ? storeItems : initialWishlist.items;

  if (items.length === 0) {
    if (mounted && status === "loading") {
      return (
        <div className="flex items-center justify-center gap-2 py-24 text-body text-dark-700">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading your wishlist…
        </div>
      );
    }
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.id}
          title={item.name}
          subtitle={item.categoryName}
          meta={item.genderLabel}
          imageSrc={item.imageUrl}
          imageAlt={item.name}
          price={formatPrice(item.minPrice, item.maxPrice)}
          href={`/products/${item.productId}`}
          defaultVariantId={item.defaultVariantId}
          wishlistProductId={item.productId}
        />
      ))}
    </div>
  );
}
