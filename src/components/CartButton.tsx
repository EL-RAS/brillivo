"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCartStore } from "@/store/cart.store";

const ICON_BTN =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-dark-900 transition-colors hover:bg-light-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2";

/**
 * Header cart indicator. Reads the live item count from the Zustand store so
 * the badge updates instantly after any add/remove, on every page.
 */
export default function CartButton({ href = "/cart" }: { href?: string }) {
  const itemCount = useCartStore((state) => state.itemCount);

  return (
    <Link
      href={href}
      aria-label={`Shopping bag${itemCount > 0 ? `, ${itemCount} items` : ""}`}
      className={ICON_BTN}
    >
      <ShoppingBag aria-hidden="true" className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-dark-900 px-1 text-[10px] font-medium leading-none text-light-100">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
