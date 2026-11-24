"use client";

import { create } from "zustand";

import {
  addCartItem as addCartItemAction,
  clearCart as clearCartAction,
  getCart as getCartAction,
  removeCartItem as removeCartItemAction,
  updateCartItem as updateCartItemAction,
  type CartItemView,
  type CartView,
} from "@/lib/actions/cart";

/**
 * Client-side cart store.
 *
 * The database is the single source of truth. This store is a thin, optimistic
 * mirror: every mutation calls a server action, then stores the canonical
 * {@link CartView} the action returns. That keeps the navbar badge, cart page
 * and PDP in lockstep without any client-side price math drifting from the DB.
 */

export type CartItem = CartItemView;

export type CartStatus = "idle" | "loading" | "ready" | "error";

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  status: CartStatus;
  error: string | null;
  lastSyncedAt: number | null;

  /** Replaces local state with a server snapshot (used on hydration/refresh). */
  hydrate: (cart: CartView) => void;
  /** Fetches the cart from the server. */
  refresh: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
  /** Convenience selector for the navbar badge. */
  getItemCount: () => number;
}

const EMPTY: Pick<CartView, "items" | "itemCount" | "subtotal"> = {
  items: [],
  itemCount: 0,
  subtotal: 0,
};

export const useCartStore = create<CartState>((set, get) => ({
  ...EMPTY,
  status: "idle",
  error: null,
  lastSyncedAt: null,

  hydrate: (cart) =>
    set({
      items: cart.items,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      status: "ready",
      error: null,
      lastSyncedAt: Date.now(),
    }),

  refresh: async () => {
    set({ status: "loading", error: null });
    try {
      const cart = await getCartAction();
      get().hydrate(cart);
    } catch (error) {
      console.error("Failed to refresh the cart.", error);
      set({ status: "error", error: "Unable to load your bag." });
    }
  },

  addItem: async (variantId, quantity = 1) => {
    set({ status: "loading", error: null });
    try {
      const result = await addCartItemAction(variantId, quantity);
      if (!result.ok) {
        set({ status: "error", error: result.error });
        return false;
      }
      get().hydrate(result.cart);
      return true;
    } catch (error) {
      console.error("Failed to add to the cart.", error);
      set({ status: "error", error: "Unable to add this piece to your bag." });
      return false;
    }
  },

  updateQuantity: async (cartItemId, quantity) => {
    set({ status: "loading", error: null });
    try {
      const result = await updateCartItemAction(cartItemId, quantity);
      if (!result.ok) {
        set({ status: "error", error: result.error });
        return false;
      }
      get().hydrate(result.cart);
      return true;
    } catch (error) {
      console.error("Failed to update the cart item.", error);
      set({ status: "error", error: "Unable to update this item." });
      return false;
    }
  },

  removeItem: async (cartItemId) => {
    set({ status: "loading", error: null });
    try {
      const result = await removeCartItemAction(cartItemId);
      if (!result.ok) {
        set({ status: "error", error: result.error });
        return false;
      }
      get().hydrate(result.cart);
      return true;
    } catch (error) {
      console.error("Failed to remove the cart item.", error);
      set({ status: "error", error: "Unable to remove this item." });
      return false;
    }
  },

  clear: async () => {
    set({ status: "loading", error: null });
    try {
      const result = await clearCartAction();
      if (!result.ok) {
        set({ status: "error", error: result.error });
        return false;
      }
      get().hydrate(result.cart);
      return true;
    } catch (error) {
      console.error("Failed to clear the cart.", error);
      set({ status: "error", error: "Unable to empty your bag." });
      return false;
    }
  },

  getItemCount: () => get().itemCount,
}));
