"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useWishlistStore } from "@/store/wishlist.store";

const ICON_BTN =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-dark-900 transition-colors hover:bg-light-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2";

/**
 * Header wishlist indicator. Reads the live count from the Zustand store so the
 * badge updates instantly after any toggle, on every page.
 */
export default function WishlistButton({ href = "/wishlist" }: { href?: string }) {
  const count = useWishlistStore((state) => state.count);

  return (
    <Link
      href={href}
      aria-label={`Wishlist${count > 0 ? `, ${count} items` : ""}`}
      className={ICON_BTN}
    >
      <Heart aria-hidden="true" className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-dark-900 px-1 text-[10px] font-medium leading-none text-light-100">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
