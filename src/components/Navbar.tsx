"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Heart, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import CartButton from "./CartButton";
import WishlistButton from "./WishlistButton";
import { signOut } from "@/lib/auth/actions";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

export interface NavbarProps {
  logoSrc?: string;
  wordmark?: string;
  links?: readonly NavItem[];
  cartHref?: string;
  wishlistHref?: string;
  announcement?: string;
  user?: NavbarUser | null;
}

const DEFAULT_LINKS: readonly NavItem[] = [
  { label: "Rings", href: "/products?category=rings" },
  { label: "Bracelets", href: "/products?category=bracelets" },
  { label: "Earrings", href: "/products?category=earrings" },
  { label: "Necklaces", href: "/products?category=necklaces" },
  { label: "Collections", href: "/collections" },
];

const ICON_BTN =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-dark-900 transition-colors hover:bg-light-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2";

const DESKTOP_LINK =
  "relative inline-block text-caption uppercase tracking-[0.22em] text-dark-900 transition-colors hover:text-silver-600 focus:outline-none focus-visible:text-silver-600 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-silver-500 after:transition-all after:duration-300 hover:after:w-full focus-visible:after:w-full";

const MOBILE_LINK =
  "block border-b border-silver-200 py-3 text-body-medium uppercase tracking-[0.18em] text-dark-900 transition-colors hover:text-silver-600";

function SearchField({ id, className = "" }: { id: string; className?: string }) {
  return (
    <form
      action="/products"
      method="get"
      role="search"
      className={className}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        const value = new FormData(e.currentTarget).get("search");
        if (!value || !String(value).trim()) e.preventDefault();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search Brillivo
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-600"
        />
        <input
          id={id}
          type="search"
          name="search"
          placeholder="Search jewelry"
          autoComplete="off"
          className="h-10 w-full rounded-full border border-silver-300 bg-light-200 pl-11 pr-4 text-caption text-dark-900 transition-all placeholder:text-silver-600 focus:border-silver-500 focus:bg-light-100 focus:outline-none focus:ring-1 focus:ring-[--color-silver-500]"
        />
      </div>
    </form>
  );
}

export default function Navbar({
  logoSrc = "/logo_removebg.png",
  wordmark = "Brillivo",
  links = DEFAULT_LINKS,
  cartHref = "/cart",
  wishlistHref = "/wishlist",
  announcement = "Complimentary shipping & returns on every order",
  user = null,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const wishlistCount = useWishlistStore((state) => state.count);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("#user-menu")) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const displayName = user?.name?.trim() || user?.email || "Account";

  const handleSignOut = async () => {
    setMenuOpen(false);
    setOpen(false);
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50">
      {announcement && (
        <p className="bg-dark-900 px-4 py-1.5 text-center text-[11px] uppercase tracking-[0.18em] text-silver-300 sm:py-2 sm:text-footnote sm:tracking-[0.25em]">
          {announcement}
        </p>
      )}

      <div className="border-b border-silver-200 bg-light-100/90 backdrop-blur-md">
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            aria-label={`${wordmark} home`}
            className="flex shrink-0 items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2"
          >
            <Image
              src={logoSrc}
              alt=""
              width={44}
              height={44}
              priority
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            />
            <span className="hidden text-caption font-medium uppercase tracking-[0.45em] text-dark-900 sm:block">
              {wordmark}
            </span>
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={DESKTOP_LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 sm:gap-2">
            <SearchField id="nav-search" className="hidden w-56 md:block xl:w-72" />

            <WishlistButton href={wishlistHref} />

            <CartButton href={cartHref} />

            {user ? (
              <div id="user-menu" className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((value) => !value);
                  }}
                  className={`${ICON_BTN} gap-2 px-3 w-auto`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <User aria-hidden="true" className="h-5 w-5" />
                  <span className="hidden text-caption uppercase tracking-[0.18em] text-dark-900 sm:block">
                  </span>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 w-56 rounded-2xl border border-silver-200 bg-light-100 shadow-xl"
                  >
                    <div className="border-b border-silver-200 px-4 py-3">
                      <p className="text-caption text-dark-900">{displayName}</p>
                      <p className="mt-1 text-footnote text-dark-700 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-3 text-caption text-dark-900 transition-colors hover:bg-light-200"
                    >
                      <LogOut aria-hidden="true" className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/sign-in"
                className={ICON_BTN}
                aria-label="Sign in"
              >
								LogIn
              </Link>
            )}

            <button
              type="button"
              className={`${ICON_BTN} lg:hidden`}
              aria-controls="mobile-menu"
              aria-expanded={open}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>

        <div
          id="mobile-menu"
          hidden={!open}
          className="border-t border-silver-200 bg-light-100 lg:hidden"
        >
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6">
            <SearchField id="mobile-search" />

            <ul>
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={MOBILE_LINK} onClick={() => setOpen(false)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 pt-1">
              <Link
                href={wishlistHref}
                className="flex items-center gap-2 text-caption uppercase tracking-[0.18em] text-dark-900"
                onClick={() => setOpen(false)}
              >
                <Heart aria-hidden="true" className="h-4 w-4" />
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>
              <Link
                href={cartHref}
                className="flex items-center gap-2 text-caption uppercase tracking-[0.18em] text-dark-900"
                onClick={() => setOpen(false)}
              >
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                Bag {itemCount > 0 && `(${itemCount})`}
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-caption uppercase tracking-[0.18em] text-dark-900"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Sign out
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex items-center gap-2 text-caption uppercase tracking-[0.18em] text-dark-900"
                  onClick={() => setOpen(false)}
                >
                  <User aria-hidden="true" className="h-4 w-4" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
