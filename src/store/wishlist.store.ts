"use client";

import { create } from "zustand";

import {
  addToWishlist as addToWishlistAction,
  getWishlist as getWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  type WishlistItemView,
  type WishlistView,
} from "@/lib/actions/wishlist";

/**
 * Client-side wishlist store.
 *
 * The database is the single source of truth; this store is a thin optimistic
 * mirror, exactly like the cart store. It additionally tracks the membership of
 * each product id so every heart button across the app (cards, PDP, navbar) can
 * render its filled/active state instantly without prop drilling — every toggle
 * calls a server action and then stores the canonical {@link WishlistView}.
 */

export type WishlistItem = WishlistItemView;

export type WishlistStatus = "idle" | "loading" | "ready" | "error";

interface WishlistToggleResult {
  ok: boolean;
  error?: string;
}

interface WishlistState {
  items: WishlistItem[];
  count: number;
  status: WishlistStatus;
  error: string | null;
  lastSyncedAt: number | null;
  /** Product ids currently saved, for O(1) heart-state lookups. */
  productIds: string[];

  /** Replaces local state with a server snapshot (used on hydration/refresh). */
  hydrate: (wishlist: WishlistView) => void;
  /** Fetches the wishlist from the server. */
  refresh: () => Promise<void>;
  /** Adds a product if absent, removes it if present. */
  toggle: (productId: string) => Promise<WishlistToggleResult>;
  add: (productId: string) => Promise<WishlistToggleResult>;
  remove: (productId: string) => Promise<WishlistToggleResult>;
  /** True when the given product is saved. */
  isWished: (productId: string) => boolean;
}

const EMPTY: Pick<WishlistView, "items" | "count"> = { items: [], count: 0 };

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ...EMPTY,
  status: "idle",
  error: null,
  lastSyncedAt: null,
  productIds: [],

  hydrate: (wishlist) =>
    set({
      items: wishlist.items,
      count: wishlist.count,
      productIds: wishlist.items.map((item) => item.productId),
      status: "ready",
      error: null,
      lastSyncedAt: Date.now(),
    }),

  refresh: async () => {
    set({ status: "loading", error: null });
    try {
      const wishlist = await getWishlistAction();
      get().hydrate(wishlist);
    } catch (error) {
      console.error("Failed to refresh the wishlist.", error);
      set({ status: "error", error: "Unable to load your wishlist." });
    }
  },

  isWished: (productId) => get().productIds.includes(productId),

  add: async (productId) => {
    // Optimistic: flip the heart immediately, revert if the action fails.
    const previous = get().productIds;
    if (!previous.includes(productId)) {
      set({
        productIds: [...previous, productId],
        count: get().count + 1,
        status: "loading",
        error: null,
      });
    }

    try {
      const result = await addToWishlistAction(productId);
      if (!result.ok) {
        set({ productIds: previous, count: previous.length });
        set({ status: "error", error: result.error });
        return { ok: false, error: result.error };
      }
      get().hydrate(result.wishlist);
      return { ok: true };
    } catch (error) {
      console.error("Failed to add to the wishlist.", error);
      set({ productIds: previous, count: previous.length });
      set({ status: "error", error: "Unable to save this piece." });
      return { ok: false, error: "Unable to save this piece." };
    }
  },

  remove: async (productId) => {
    const previous = get().productIds;
    set({
      productIds: previous.filter((id) => id !== productId),
      count: Math.max(0, get().count - 1),
      status: "loading",
      error: null,
    });

    try {
      const result = await removeFromWishlistAction(productId);
      if (!result.ok) {
        set({ productIds: previous, count: previous.length });
        set({ status: "error", error: result.error });
        return { ok: false, error: result.error };
      }
      get().hydrate(result.wishlist);
      return { ok: true };
    } catch (error) {
      console.error("Failed to remove from the wishlist.", error);
      set({ productIds: previous, count: previous.length });
      set({ status: "error", error: "Unable to remove this piece." });
      return { ok: false, error: "Unable to remove this piece." };
    }
  },

  toggle: async (productId) => {
    return get().isWished(productId) ? get().remove(productId) : get().add(productId);
  },
}));
