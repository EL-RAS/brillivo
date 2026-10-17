import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/db/schema";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface BrillivoState {
  cart: CartItem[];
  wishlistIds: number[];
  selectedCategory: string;
  searchQuery: string;
  sortBy: "featured" | "price-asc" | "price-desc" | "rating";
  isCartOpen: boolean;
  isAuthModalOpen: boolean;
  activeProductModal: Product | null;

  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: number) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: "featured" | "price-asc" | "price-desc" | "rating") => void;
  setCartOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setActiveProductModal: (product: Product | null) => void;
}

export const useBrillivoStore = create<BrillivoState>()(
  persist(
    (set) => ({
      cart: [],
      wishlistIds: [],
      selectedCategory: "All",
      searchQuery: "",
      sortBy: "featured",
      isCartOpen: false,
      isAuthModalOpen: false,
      activeProductModal: null,

      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isCartOpen: true,
            };
          }
          return {
            cart: [...state.cart, { product, quantity }],
            isCartOpen: true,
          };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter((item) => item.product.id !== productId),
            };
          }
          return {
            cart: state.cart.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          };
        }),

      clearCart: () => set({ cart: [] }),

      toggleWishlist: (productId) =>
        set((state) => ({
          wishlistIds: state.wishlistIds.includes(productId)
            ? state.wishlistIds.filter((id) => id !== productId)
            : [...state.wishlistIds, productId],
        })),

      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortBy: (sortBy) => set({ sortBy }),
      setCartOpen: (isCartOpen) => set({ isCartOpen }),
      setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
      setActiveProductModal: (activeProductModal) => set({ activeProductModal }),
    }),
    {
      name: "brillivo-luxury-store",
      partialize: (state) => ({
        cart: state.cart,
        wishlistIds: state.wishlistIds,
      }),
    }
  )
);
