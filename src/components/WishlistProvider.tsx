"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import type { WishlistView } from "@/lib/actions/wishlist";
import { useWishlistStore } from "@/store/wishlist.store";

/**
 * Bridges the server-rendered wishlist into the client store.
 *
 * On first mount it hydrates the store with the server snapshot (so the navbar
 * badge and every heart are correct before interaction) and re-syncs on route
 * changes — keeping state consistent after sign-in/sign-out and navigation.
 */
export default function WishlistProvider({
  initialWishlist,
  children,
}: {
  initialWishlist: WishlistView;
  children: React.ReactNode;
}) {
  const hydrate = useWishlistStore((state) => state.hydrate);
  const refresh = useWishlistStore((state) => state.refresh);
  const pathname = usePathname();
  const hydrated = useRef(false);

  useEffect(() => {
    hydrate(initialWishlist);
    hydrated.current = true;
  }, [initialWishlist, hydrate]);

  useEffect(() => {
    // Skip the very first run; the initial snapshot is already fresh.
    if (!hydrated.current) return;
    void refresh();
  }, [pathname, refresh]);

  return <>{children}</>;
}
