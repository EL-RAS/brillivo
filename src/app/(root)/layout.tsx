import { CartProvider, Footer, Navbar, WishlistProvider } from "@/components";
import { getCart } from "@/lib/actions/cart";
import { getWishlist } from "@/lib/actions/wishlist";
import { getCurrentUser } from "@/lib/auth/actions";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [initialCart, initialWishlist, currentUser] = await Promise.all([
    getCart(),
    getWishlist(),
    getCurrentUser(),
  ]);

  return (
    <CartProvider initialCart={initialCart}>
      <WishlistProvider initialWishlist={initialWishlist}>
        <Navbar user={currentUser} />
        {children}
        <Footer />
      </WishlistProvider>
    </CartProvider>
  );
}
