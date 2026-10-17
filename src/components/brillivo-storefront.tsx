"use client";

import React, { useMemo, useState } from "react";
import {
  ShoppingBag,
  Heart,
  Search,
  Sparkles,
  ShieldCheck,
  Database,
  User,
  X,
  Plus,
  Minus,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import type { Product } from "@/db/schema";
import { useBrillivoStore } from "@/store/use-brillivo-store";
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";

interface BrillivoStorefrontProps {
  initialProducts: Product[];
  dataSource: "neon-drizzle" | "seed-fallback";
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function BrillivoStorefront({
  initialProducts,
  dataSource,
}: BrillivoStorefrontProps) {
  const {
    cart,
    wishlistIds,
    selectedCategory,
    searchQuery,
    sortBy,
    isCartOpen,
    isAuthModalOpen,
    activeProductModal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    setSelectedCategory,
    setSearchQuery,
    setSortBy,
    setCartOpen,
    setAuthModalOpen,
    setActiveProductModal,
  } = useBrillivoStore();

  const { data: session } = useSession();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [checkoutToast, setCheckoutToast] = useState(false);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(initialProducts.map((p) => p.category)));
    return ["All", ...unique];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        const matchesCategory =
          selectedCategory === "All" || product.category === selectedCategory;
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !q ||
          product.name.toLowerCase().includes(q) ||
          product.subtitle.toLowerCase().includes(q) ||
          product.gemstone.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.priceCents - b.priceCents;
        if (sortBy === "price-desc") return b.priceCents - a.priceCents;
        if (sortBy === "rating") return parseFloat(b.rating) - parseFloat(a.rating);
        return a.id - b.id;
      });
  }, [initialProducts, selectedCategory, searchQuery, sortBy]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = cart.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0
  );

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthStatus("Authenticating with Better Auth...");
    try {
      if (authMode === "signup") {
        await signUp.email({ email, password, name });
      } else {
        await signIn.email({ email, password });
      }
      setAuthStatus(null);
      setAuthModalOpen(false);
    } catch (err) {
      setAuthStatus(
        err instanceof Error
          ? err.message
          : "Configure DATABASE_URL & BETTER_AUTH_SECRET in .env to enable live DB sessions."
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      {/* Top Announcement & Stack Status Bar */}
      <div className="border-b border-sky-950/60 bg-[#05080e] px-4 py-2 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>
              <strong className="text-sky-300">BRILLIVO Signature Collection</strong> — Complimentary Insured Express Delivery & Hallmarked Presentation Box
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
              <Database className="h-3 w-3" />
              {dataSource === "neon-drizzle"
                ? "Neon PostgreSQL + Drizzle ORM Live"
                : "Drizzle ORM Schema Ready (Seed Dataset Active)"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#070b12]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/40 bg-gradient-to-br from-sky-500/20 to-blue-900/30 shadow-inner shadow-sky-400/20">
              <Sparkles className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <span className="block text-xl font-semibold tracking-[0.28em] text-white">
                BRILLIVO
              </span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-sky-400/90">
                Signature Collection
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="hidden max-w-md flex-1 mx-8 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Sky Blue Topaz, Bolo Bracelet, Huggie Hoops, SKU..."
                className="w-full rounded-full border border-slate-800 bg-slate-900/80 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:border-sky-500/50 hover:text-white"
            >
              <User className="h-4 w-4 text-sky-400" />
              <span>{session?.user ? session.user.name : "Better Auth"}</span>
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-blue-500"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Bag</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-950/80 px-1.5 text-[11px] font-bold text-sky-300">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Featuring The Hybrid Wave Bracelet */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0b1320] via-[#070b12] to-[#070b12] py-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-medium text-sky-300">
              <span>BRILLIVO • MARKET-FIRST FINE JEWELRY ARCHITECTURE</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:leading-[1.12]">
              Sculpted Sterling Silver &{" "}
              <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                Aquatic Blue Topaz
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-300">
              From our market-first{" "}
              <strong className="text-white">Hybrid Wave Bracelet</strong> uniting
              Italian mesh and diamond tennis chains to flame-crested open cuffs and
              compass-set princess topaz rings, every Brillivo creation is hallmarked
              and engineered for luminous movement.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {initialProducts[0] && (
                <button
                  onClick={() => addToCart(initialProducts[0], 1)}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-400/25 transition hover:bg-sky-300"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Acquire The Hybrid Wave Bracelet —{" "}
                  {formatPrice(initialProducts[0].priceCents)}
                </button>
              )}
              {initialProducts[0] && (
                <button
                  onClick={() => setActiveProductModal(initialProducts[0])}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-sky-400/50 hover:text-white"
                >
                  <span>Inspect Craftsmanship</span>
                  <ArrowUpRight className="h-4 w-4 text-sky-400" />
                </button>
              )}
            </div>
          </div>

          {initialProducts[0] && (
            <div className="lg:col-span-5">
              <div className="group relative overflow-hidden rounded-3xl border border-sky-500/30 bg-slate-900/70 p-3 shadow-2xl shadow-sky-950/50">
                <img
                  src={initialProducts[0].imageUrl}
                  alt={initialProducts[0].name}
                  className="h-72 w-full rounded-2xl object-cover sm:h-80 transition duration-500 group-hover:scale-[1.02]"
                />
                <div className="mt-3 flex items-center justify-between px-2 py-1">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-sky-400">
                      {initialProducts[0].sku} • Featured Flagship
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {initialProducts[0].name}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300">
                    {formatPrice(initialProducts[0].priceCents)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filter & Sort Controls (Zustand State) */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-800/80 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-sky-400 text-slate-950 shadow-md shadow-sky-400/20"
                      : "border border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-sky-400" />
            <label htmlFor="sort-select" className="text-xs text-slate-400">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "featured"
                    | "price-asc"
                    | "price-desc"
                    | "rating"
                )
              }
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
            >
              <option value="featured">Featured Signature Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Client Rating</option>
            </select>
          </div>
        </div>

        {/* Drizzle Queried Products Grid */}
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const isWishlisted = wishlistIds.includes(product.id);
            return (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/50 transition hover:border-sky-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-sky-950/30"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    onClick={() => setActiveProductModal(product)}
                    className="h-full w-full cursor-pointer object-cover transition duration-500 group-hover:scale-105"
                  />
                  {product.badge && (
                    <span className="absolute left-3.5 top-3.5 rounded-full border border-sky-400/30 bg-slate-950/85 px-3 py-1 text-[11px] font-semibold text-sky-300 backdrop-blur-md">
                      {product.badge}
                    </span>
                  )}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={`Save ${product.name} to wishlist`}
                    className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/80 text-slate-200 backdrop-blur-md transition hover:border-sky-400 hover:text-sky-300"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isWishlisted ? "fill-sky-400 text-sky-400" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px] text-sky-400">
                        {product.sku} • {product.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-amber-300" />
                        {product.rating} ({product.reviewCount})
                      </span>
                    </div>

                    <h2
                      onClick={() => setActiveProductModal(product)}
                      className="mt-2 cursor-pointer text-lg font-bold text-white transition group-hover:text-sky-300"
                    >
                      {product.name}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-300">
                      {product.subtitle}
                    </p>
                    <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-slate-400">
                      {product.description}
                    </p>

                    <div className="mt-4 space-y-1 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500">Metal: </span>
                        {product.metalType}
                      </div>
                      <div>
                        <span className="text-slate-500">Gemstone: </span>
                        {product.gemstone}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
                    <div>
                      <span className="text-lg font-bold text-white">
                        {formatPrice(product.priceCents)}
                      </span>
                      {product.compareAtPriceCents && (
                        <span className="ml-2 text-xs text-slate-500 line-through">
                          {formatPrice(product.compareAtPriceCents)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveProductModal(product)}
                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-sky-400 hover:text-white"
                      >
                        Specs
                      </button>
                      <button
                        onClick={() => addToCart(product, 1)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Product Specification Modal */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-sky-500/30 bg-[#0b121e] p-6 shadow-2xl">
            <button
              onClick={() => setActiveProductModal(null)}
              className="absolute right-5 top-5 rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img
                  src={activeProductModal.imageUrl}
                  alt={activeProductModal.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-sky-400">
                    {activeProductModal.sku} • {activeProductModal.collection}
                  </span>
                  <h3 className="mt-1 text-2xl font-bold text-white">
                    {activeProductModal.name}
                  </h3>
                  <p className="mt-1 text-xs text-sky-300">
                    {activeProductModal.subtitle}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-300">
                    {activeProductModal.description}
                  </p>

                  <div className="mt-4 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs">
                    <p>
                      <strong className="text-slate-400">Setting / Clasp:</strong>{" "}
                      {activeProductModal.specs.claspOrSetting}
                    </p>
                    <p>
                      <strong className="text-slate-400">Dimensions:</strong>{" "}
                      {activeProductModal.specs.dimensions}
                    </p>
                    <p>
                      <strong className="text-slate-400">Hallmark Engraving:</strong>{" "}
                      {activeProductModal.specs.engraving}
                    </p>
                    <p>
                      <strong className="text-slate-400">Stone Cut:</strong>{" "}
                      {activeProductModal.specs.stoneCut}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(activeProductModal.priceCents)}
                  </span>
                  <button
                    onClick={() => {
                      addToCart(activeProductModal, 1);
                      setActiveProductModal(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-6 py-2.5 text-xs font-semibold text-slate-950 hover:bg-sky-300"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zustand Slide-Over Shopping Bag Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-[#080d16] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white">
                  Brillivo Collector Bag ({totalItems})
                </h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-full border border-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 flex-1 space-y-4 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex h-60 flex-col items-center justify-center text-center text-slate-400">
                  <ShoppingBag className="mb-3 h-10 w-10 text-slate-600" />
                  <p className="text-sm font-medium">Your collector bag is empty.</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Select any piece from the Brillivo Signature Collection.
                  </p>
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex gap-3.5 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-sky-400">{product.sku}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-xs text-slate-500 hover:text-rose-400"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="text-slate-300 hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="text-slate-300 hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-white">
                          {formatPrice(product.priceCents * quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Insured Vault Subtotal</span>
                  <span className="text-lg font-bold text-white">
                    {formatPrice(subtotalCents)}
                  </span>
                </div>
                {checkoutToast && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Brillivo reservation confirmed! Your hallmarked gift box is
                      queued for insured dispatch.
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="rounded-full border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 hover:border-slate-500"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setCheckoutToast(true)}
                    className="flex-1 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-sky-500/20 hover:from-sky-300 hover:to-blue-400"
                  >
                    Complete Private Reservation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Better Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b121e] p-6 shadow-2xl">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute right-5 top-5 rounded-full border border-slate-800 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-sky-400">
              <Lock className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Better Auth + Drizzle PostgreSQL Adapter
              </span>
            </div>

            <h3 className="mt-2 text-xl font-bold text-white">
              {authMode === "signin"
                ? "Sign In to Brillivo Vault"
                : "Create Collector Account"}
            </h3>

            {session?.user ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-300">
                  Signed in as <strong>{session.user.email}</strong>
                </p>
                <button
                  onClick={() => signOut()}
                  className="w-full rounded-full border border-rose-500/40 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-xs text-slate-400">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Layla Al-Mansoor"
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collector@brillivo.com"
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                {authStatus && (
                  <p className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                    {authStatus}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-full bg-sky-400 py-2.5 text-xs font-semibold text-slate-950 hover:bg-sky-300"
                >
                  {authMode === "signin" ? "Sign In with Better Auth" : "Create Account"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode(authMode === "signin" ? "signup" : "signin")
                  }
                  className="w-full text-center text-xs text-slate-400 hover:text-sky-300"
                >
                  {authMode === "signin"
                    ? "Need a collector profile? Register"
                    : "Already registered? Sign In"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-[#05080e] py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <span>
              © {new Date().getFullYear()} BRILLIVO Fine Jewelry • Signature Collection
            </span>
          </div>
          <div>
            Built with Next.js 15, TypeScript, TailwindCSS, Better Auth, Neon PostgreSQL, Drizzle ORM & Zustand
          </div>
        </div>
      </footer>
    </div>
  );
}
