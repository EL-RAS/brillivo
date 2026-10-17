import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  name: string;
  href: string;
  iconSrc?: string;
}

export interface FooterProps {
  logoSrc?: string;
  logoAlt?: string;
  columns?: FooterColumn[];
  locationLabel?: string;
  copyrightText?: string;
  legalLinks?: FooterLink[];
  className?: string;
}

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Featured",
    links: [
      { label: "Hybrid Wave Bracelet", href: "#hybrid-wave-bracelet" },
      { label: "Eternal Flame Cuff", href: "#eternal-flame-cuff" },
      { label: "Vortex Topaz Ring", href: "#vortex-topaz-ring" },
      { label: "Twisted Flame Pendant", href: "#twisted-flame-pendant" },
    ],
  },
  {
    title: "Jewelry",
    links: [
      { label: "All Fine Jewelry", href: "#all-jewelry" },
      { label: "Signature Rings", href: "#rings" },
      { label: "Bracelets & Cuffs", href: "#bracelets" },
      { label: "Earrings & Climbers", href: "#earrings" },
    ],
  },
  {
    title: "Collections",
    links: [
      { label: "Signature Collection", href: "#signature-collection" },
      { label: "Sky Blue Topaz", href: "#sky-blue-topaz" },
      { label: "London Blue Heritage", href: "#london-blue" },
      { label: "Pavé Diamond Icons", href: "#pave-icons" },
    ],
  },
  {
    title: "Client Care",
    links: [
      { label: "Bespoke Sizing Guide", href: "#sizing-guide" },
      { label: "Hallmark & Authenticity", href: "#authenticity" },
      { label: "Insured Vault Delivery", href: "#delivery" },
      { label: "Private Consultation", href: "#consultation" },
    ],
  },
];

const DEFAULT_LEGAL_LINKS: FooterLink[] = [
  { label: "Guides", href: "#guides" },
  { label: "Terms of Sale", href: "#terms-of-sale" },
  { label: "Terms of Use", href: "#terms-of-use" },
  { label: "Brillivo Privacy Policy", href: "#privacy-policy" },
];

export function Footer({
  logoSrc = "/logo3__2_-removebg-preview.png",
  logoAlt = "Brillivo Emblem",
  columns = DEFAULT_FOOTER_COLUMNS,
  locationLabel = "Global Atelier",
  copyrightText = `© ${new Date().getFullYear()} Brillivo, Inc. All Rights Reserved`,
  legalLinks = DEFAULT_LEGAL_LINKS,
  className = "",
}: FooterProps) {
  return (
    <footer
      aria-label="Site Footer"
      className={`w-full bg-[var(--dark)] text-[var(--light)] font-jost ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6 lg:px-8">
        {/* Top Section: Brand Emblem, 4 Navigation Columns, and Social Icons */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column: Jewelry Brand Emblem from /public */}
          <div className="lg:col-span-2 flex items-start">
            <Link
              href="/"
              aria-label="Brillivo Home"
              className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-sm"
            >
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={48}
                height={48}
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </Link>
          </div>

          {/* Center 4 Columns: Categorized Jewelry Navigation */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-body-medium font-medium text-[var(--light)] mb-4">
                  {column.title}
                </h2>
                <ul className="space-y-2.5" role="list">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-caption text-[var(--gray)]/80 transition-colors duration-200 hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right Column: Social Icon Buttons */}
          <div className="flex items-start gap-3 lg:col-span-2 lg:justify-end">
            <a
              href="#x-social"
              aria-label="Follow Brillivo on X"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--light)] text-[var(--dark)] transition-colors duration-200 hover:bg-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)]"
            >
              <Image
                src="/x.svg"
                alt=""
                width={16}
                height={14}
                className="h-3.5 w-3.5 object-contain"
              />
            </a>

            <a
              href="#facebook-social"
              aria-label="Follow Brillivo on Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--light)] text-[var(--dark)] transition-colors duration-200 hover:bg-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M13.5 21v-7.5h2.5l.38-3h-2.88V8.63c0-.87.24-1.46 1.49-1.46H16.5V4.5a20.1 20.1 0 0 0-2.28-.12c-2.26 0-3.8 1.38-3.8 3.91v2.21H8v3h2.42V21h3.08Z" />
              </svg>
            </a>

            <a
              href="#instagram-social"
              aria-label="Follow Brillivo on Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--light)] text-[var(--dark)] transition-colors duration-200 hover:bg-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom Bar: Location Pin + Copyright + Legal Policy Links (Matches Frame.png) */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[var(--gray)]/15 pt-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3 text-footnote">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--light)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5 text-[var(--agua)]"
              >
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
              </svg>
              {locationLabel}
            </span>
            <span className="text-[var(--gray)]/70">{copyrightText}</span>
          </div>

          <ul className="flex flex-wrap items-center gap-6" role="list">
            {legalLinks.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-footnote text-[var(--gray)]/70 transition-colors duration-200 hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
