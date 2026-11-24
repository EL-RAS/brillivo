import type { Metadata } from "next";

import { WishlistView } from "@/components";
import { getWishlist } from "@/lib/actions/wishlist";

export const metadata: Metadata = {
  title: "Wishlist — Brillivo",
  description: "Your saved Brillivo silver jewelry pieces, ready when you are.",
};

export default async function WishlistPage() {
  const wishlist = await getWishlist();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-silver-200 pb-6">
        <p className="text-footnote uppercase tracking-[0.3em] text-silver-600">Saved for later</p>
        <h1 className="mt-3 text-heading-3 text-dark-900 sm:text-heading-2">Wishlist</h1>
        <p className="mt-2 text-body text-dark-700">
          {wishlist.count > 0
            ? `${wishlist.count} ${wishlist.count === 1 ? "piece" : "pieces"} saved to your collection.`
            : "Keep the pieces you love in one place."}
        </p>
      </header>

      <WishlistView initialWishlist={wishlist} />
    </main>
  );
}
