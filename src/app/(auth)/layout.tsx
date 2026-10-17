import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[var(--light)] text-[var(--dark)] font-jost">
      {/* Left Brand Showcase Panel (Dark theme panel inspired by reference split layout, using /public jewelry assets) */}
      <aside
        aria-label="Brillivo Brand Showcase"
        className="relative flex flex-col justify-between bg-[var(--dark)] text-[var(--light)] p-6 sm:p-10 lg:p-14 xl:p-16 overflow-hidden"
      >
        {/* Subtle jewelry background accent from /public */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image
            src="/images/bracelet_01.jpg"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--dark)] via-[var(--dark)]/85 to-[var(--dark)]/60" />
        </div>

        {/* Top-Left: Square Rounded Logo Badge from /public */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Return to Brillivo Home"
            className="group inline-flex items-center gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-xl"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--light)] p-2 shadow-md transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/logo3__2_-removebg-preview.png"
                alt="Brillivo Emblem"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </span>
            <span className="text-lead font-bold tracking-[0.22em] text-[var(--light)]">
              BRILLIVO
            </span>
          </Link>
        </div>

        {/* Middle-Left: Editorial Jewelry Headline, Copy & Carousel Dots */}
        <div className="relative z-10 my-10 lg:my-0 max-w-lg">
          <p className="mb-3 text-caption font-medium uppercase tracking-[0.22em] text-[var(--agua)]">
            Signature Collection
          </p>
          <h2 className="text-3xl sm:text-5xl lg:text-heading-2 font-bold tracking-tight text-[var(--light)]">
            Crafted to Illuminate
          </h2>
          <p className="mt-4 text-body sm:text-lead text-[var(--gray)]">
            Join collectors worldwide who trust Brillivo for architectural
            sterling silver, 18K white gold vermeil, and natural Sky &amp;
            London Blue Topaz pieces.
          </p>

          {/* 3 Indicator Dots matching the reference layout */}
          <div
            aria-hidden="true"
            className="mt-7 flex items-center gap-2.5"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--light)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--gray)]/40" />
            <span className="h-2 w-2 rounded-full bg-[var(--gray)]/40" />
          </div>
        </div>

        {/* Bottom-Left: Copyright Footnote */}
        <div className="relative z-10">
          <p className="text-footnote text-[var(--gray)]/75">
            &copy; {new Date().getFullYear()} Brillivo. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Right Authentication Form Panel */}
      <main className="flex flex-col items-center justify-center bg-[var(--light)] px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        {children}
      </main>
    </div>
  );
}
