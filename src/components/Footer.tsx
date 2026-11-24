"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: readonly FooterLink[];
  span: string;
}

const SHOP_LINKS: readonly FooterLink[] = [
  { label: "Rings", href: "/products?category=rings" },
  { label: "Bracelets", href: "/products?category=bracelets" },
  { label: "Earrings", href: "/products?category=earrings" },
  { label: "Necklaces", href: "/products?category=necklaces" },
  { label: "Collections", href: "/collections" },
];

const CARE_LINKS: readonly FooterLink[] = [
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "Order Tracking", href: "/orders" },
  { label: "Ring Size Guide", href: "/size-guide" },
  { label: "Care & Polishing", href: "/care" },
];

const HOUSE_LINKS: readonly FooterLink[] = [
  { label: "Our Story", href: "/about" },
  { label: "Craftsmanship", href: "/craftsmanship" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Stores", href: "/stores" },
  { label: "Journal", href: "/journal" },
];

const COLUMNS: readonly FooterColumn[] = [
  { title: "Shop", links: SHOP_LINKS, span: "lg:col-span-2" },
  { title: "Customer Care", links: CARE_LINKS, span: "lg:col-span-3" },
  { title: "The House", links: HOUSE_LINKS, span: "lg:col-span-3" },
];

const SOCIALS: readonly { href: string; src: string; label: string }[] = [
  { href: "https://instagram.com", src: "/instagram.svg", label: "Instagram" },
  { href: "https://facebook.com", src: "/facebook.svg", label: "Facebook" },
  { href: "https://x.com", src: "/x.svg", label: "X" },
];

const LEGAL_LINKS: readonly FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Terms of Sale", href: "/terms-of-sale" },
];

const COLUMN_LINK =
  "text-body text-light-400 transition-colors hover:text-light-100 focus:outline-none focus-visible:text-light-100";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-dark-900 text-light-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <section
          aria-labelledby="newsletter-heading"
          className="grid gap-6 border-b border-white/10 pb-12 lg:grid-cols-2 lg:items-center lg:gap-16"
        >
          <div>
            <p className="text-footnote uppercase tracking-[0.3em] text-silver-400">Newsletter</p>
            <h2 id="newsletter-heading" className="mt-3 text-heading-3 text-light-100">
              Discover new collections first
            </h2>
            <p className="mt-2 max-w-md text-body text-light-400">
              Subscribe for private launches of new sterling silver pieces, restock alerts and
              styling notes from Brillivo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full" noValidate={false}>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="newsletter-email"
                type="email"
                name="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSubscribed(false);
                }}
                placeholder="Your email address"
                className="h-12 min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-5 text-body text-light-100 transition-colors placeholder:text-dark-500 focus:border-silver-400 focus:outline-none focus:ring-1 focus:ring-[--color-silver-400]"
              />
              <button
                type="submit"
                className="h-12 shrink-0 rounded-full bg-light-100 px-7 text-caption uppercase tracking-[0.22em] text-dark-900 transition-colors hover:bg-silver-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-400] focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900"
              >
                Subscribe
              </button>
            </div>
            <p
              role="status"
              aria-live="polite"
              className="mt-3 min-h-5 text-caption text-silver-400"
            >
              {subscribed
                ? "Thank you — you are on the Brillivo list."
                : "No spam. Unsubscribe anytime."}
            </p>
          </form>
        </section>

        <div className="grid grid-cols-1 gap-10 pt-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link
              href="/"
              aria-label="Brillivo home"
              className="inline-flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-400]"
            >
              <Image
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                className="h-10 w-10 object-contain"
              />
              <span className="text-caption font-medium uppercase tracking-[0.45em] text-light-100">
                Brillivo
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-body text-light-400">
              Brillivo crafts modern sterling silver jewelry — hand-finished rings, bracelets,
              earrings and necklaces designed to be worn every day.
            </p>

            <ul className="mt-6 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <Link
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:border-silver-400 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-400]"
                  >
                    <Image src={social.src} alt="" width={16} height={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className={column.span}>
              <h3 className="mb-4 text-caption uppercase tracking-[0.25em] text-silver-400">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={COLUMN_LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 text-caption text-light-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Brillivo. All rights reserved.</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-light-100">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
