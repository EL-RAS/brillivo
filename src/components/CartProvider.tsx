"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import type { CartView } from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";

/**
 * Bridges the server-rendered cart into the client store.
 *
 * On first mount it hydrates the store with the server snapshot (so the navbar
 * badge is correct before any interaction). It also re-syncs whenever the route
 * changes, keeping guests and signed-in users consistent after navigation,
 * sign-in merges and checkout redirects.
 */
export default function CartProvider({
  initialCart,
  children,
}: {
  initialCart: CartView;
  children: React.ReactNode;
}) {
  const hydrate = useCartStore((state) => state.hydrate);
  const refresh = useCartStore((state) => state.refresh);
  const pathname = usePathname();
  const hydrated = useRef(false);

  useEffect(() => {
    hydrate(initialCart);
    hydrated.current = true;
  }, [initialCart, hydrate]);

  useEffect(() => {
    // Skip the very first run; the initial snapshot is already fresh.
    if (!hydrated.current) return;
    void refresh();
  }, [pathname, refresh]);

  return <>{children}</>;
}
