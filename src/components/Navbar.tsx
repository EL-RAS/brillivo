"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  logoSrc?: string;
  logoAlt?: string;
  brandName?: string;
  links?: NavLinkItem[];
  cartCount?: number;
  onSearchSubmit?: (query: string) => void;
  onCartClick?: () => void;
  className?: string;
}

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { label: "Rings", href: "#rings" },
  { label: "Necklaces", href: "#necklaces" },
  { label: "Bracelets", href: "#bracelets" },
  { label: "Earrings", href: "#earrings" },
  { label: "Collections", href: "#collections" },
  { label: "Contact", href: "#contact" },
];

export function Navbar({
  logoSrc = "/logo3__2_-removebg-preview.png",
  logoAlt = "Brillivo Fine Jewelry Emblem",
  brandName = "BRILLIVO",
  links = DEFAULT_NAV_LINKS,
  cartCount = 2,
  onSearchSubmit,
  onCartClick,
  className = "",
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsMobileMenuOpen(false);
      setIsSearchOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSearchFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery.trim());
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-[var(--light)] text-[var(--dark)] font-jost border-b border-[var(--gray)]/50 transition-colors ${className}`}
    >
      <nav
        aria-label="Primary Jewelry Store Navigation"
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        {/* Left: Brand Logo from /public */}
        <div className="flex items-center">
          <Link
            href="/"
            aria-label={`${brandName} Home`}
            className="group inline-flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] focus-visible:ring-offset-2"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={44}
                height={44}
                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </span>
            <span className="text-lead tracking-[0.22em] font-bold text-[var(--dark)] hidden sm:inline-block">
              {brandName}
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <ul className="hidden md:flex items-center gap-7 lg:gap-9" role="list">
          {links.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="text-body-medium text-[var(--dark)] transition-colors duration-200 hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] focus-visible:ring-offset-4 rounded-sm"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: Search & Cart Utilities (Desktop) */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {isSearchOpen ? (
            <form
              onSubmit={handleSearchFormSubmit}
              role="search"
              aria-label="Search jewelry catalog"
              className="flex items-center gap-2 border-b border-[var(--dark)] pb-1"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearchSubmit?.(e.target.value);
                }}
                placeholder="Search rings, topaz..."
                aria-label="Search jewelry"
                autoFocus
                className="w-44 bg-transparent text-caption text-[var(--dark)] placeholder:text-[var(--dark)]/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                  onSearchSubmit?.("");
                }}
                aria-label="Close search input"
                className="text-caption text-[var(--dark)]/70 hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)]"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
              className="text-body-medium text-[var(--dark)] transition-colors duration-200 hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] focus-visible:ring-offset-4 rounded-sm cursor-pointer"
            >
              Search
            </button>
          )}

          <button
            type="button"
            onClick={onCartClick}
            aria-label={`My Cart with ${cartCount} items`}
            className="text-body-medium text-[var(--dark)] transition-colors duration-200 hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] focus-visible:ring-offset-4 rounded-sm cursor-pointer"
          >
            My Cart ({cartCount})
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            type="button"
            onClick={onCartClick}
            aria-label={`My Cart (${cartCount})`}
            className="text-caption font-medium text-[var(--dark)] hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-sm"
          >
            My Cart ({cartCount})
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={
              isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-[var(--dark)] transition-colors hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)]"
          >
            <span className="sr-only">Toggle navigation</span>
            <div className="relative flex h-5 w-6 flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-current transition-transform duration-300 ${
                  isMobileMenuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-current transition-opacity duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-current transition-transform duration-300 ${
                  isMobileMenuOpen ? "-translate-y-2.5 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Collapsible Navigation Drawer */}
      <div
        id="mobile-navigation-menu"
        role="region"
        aria-label="Mobile Navigation"
        className={`md:hidden overflow-hidden border-t border-[var(--gray)]/50 bg-[var(--light)] transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0 border-t-0"
        }`}
      >
        <div className="space-y-4 px-4 pt-4 pb-6 sm:px-6">
          <form
            onSubmit={handleSearchFormSubmit}
            role="search"
            className="flex items-center border-b border-[var(--gray)] pb-2"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearchSubmit?.(e.target.value);
              }}
              placeholder="Search rings, bracelets, topaz..."
              aria-label="Search jewelry on mobile"
              className="w-full bg-transparent text-body text-[var(--dark)] placeholder:text-[var(--dark)]/50 focus:outline-none"
            />
          </form>

          <ul className="flex flex-col space-y-3" role="list">
            {links.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1 text-body-medium text-[var(--dark)] transition-colors hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
