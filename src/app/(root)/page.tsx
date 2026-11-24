import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components";
import { getAllProducts } from "@/lib/actions/product";

export const metadata: Metadata = {
  title: "Brillivo — Modern Sterling Silver Jewelry",
  description:
    "Discover Brillivo's hand-finished sterling silver rings, necklaces, bracelets and earrings. Sculptural silhouettes and quiet sparkle, made to be worn every day.",
};

const HERO_IMAGE = "/readme/Hero.jpg";
const CAMPAIGN_IMAGE = "/readme/Ring_banner.jpg";

function formatPrice(value: number | null): string | undefined {
  return value === null ? undefined : `$${value.toFixed(2)}`;
}

type TrendingPiece = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  imageSrc: string;
  imageAlt: string;
  sizes: string;
};

const TRENDING_PIECES: readonly TrendingPiece[] = [
  {
    eyebrow: "The Lumina Edit",
    title: "Lumina Chain Necklace",
    description:
      "A single blue topaz, framed in hand-polished sterling silver and suspended on a fine chain.",
    href: "/products?category=necklaces",
    ctaLabel: "Shop necklaces",
    imageSrc: "/products/necklacе_02.png",
    imageAlt:
      "Brillivo Lumina chain necklace with a blue topaz pendant, presented in a signature silver box",
    sizes: "(min-width: 1280px) 1280px, 100vw",
  },
  {
    eyebrow: "New signature",
    title: "Celeste Link Bracelet",
    description: "",
    href: "/products?category=bracelets",
    ctaLabel: "Shop bracelets",
    imageSrc: "/products/bracelet_02.jpg",
    imageAlt:
      "Brillivo Celeste link bracelet resting on a signature presentation box",
    sizes: "(min-width: 1280px) 640px, (min-width: 640px) 50vw, 100vw",
  },
  {
    eyebrow: "Everyday icon",
    title: "Elysian Twist Band",
    description: "",
    href: "/products?category=rings",
    ctaLabel: "Shop rings",
    imageSrc: "/products/ring_02.jpg",
    imageAlt:
      "Brillivo Elysian sterling silver twist ring set with a faceted blue stone",
    sizes: "(min-width: 1280px) 640px, (min-width: 640px) 50vw, 100vw",
  },
];

type TrendingTileProps = {
  piece: TrendingPiece;
  featured?: boolean;
};

function TrendingTile({ piece, featured = false }: TrendingTileProps) {
  return (
    <Link
      href={piece.href}
      className={`group relative isolate block overflow-hidden rounded-2xl bg-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2 ${
        featured
          ? "aspect-[4/3] sm:aspect-[2/1] lg:aspect-[2.35/1]"
          : "aspect-[4/3] sm:aspect-[16/10]"
      }`}
    >
      <Image
        src={piece.imageSrc}
        alt={piece.imageAlt}
        fill
        sizes={piece.sizes}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/30 to-transparent" />
      {featured && (
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/85 via-dark-900/35 to-transparent" />
      )}

      <div
        className={`absolute inset-0 flex flex-col ${
          featured
            ? "justify-end p-5 sm:justify-center sm:p-10 lg:p-14"
            : "justify-end p-5 sm:p-7"
        }`}
      >
        {featured ? (
          <div className="max-w-lg">
            <p className="text-footnote uppercase tracking-[0.3em] text-silver-300">
              {piece.eyebrow}
            </p>
            <h3 className="mt-3 text-[clamp(1.9rem,4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em] text-light-100">
              {piece.title}
            </h3>
            <p className="mt-3 max-w-md text-caption text-light-300 sm:mt-4 sm:text-body">
              {piece.description}
            </p>
            <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-light-100 px-5 text-caption uppercase tracking-[0.2em] text-dark-900 transition-colors group-hover:bg-silver-200 sm:mt-7 sm:h-11 sm:px-6">
              {piece.ctaLabel}
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-footnote uppercase tracking-[0.3em] text-silver-300">
                {piece.eyebrow}
              </p>
              <h3 className="mt-2 text-[clamp(1.35rem,2.2vw,1.75rem)] font-medium leading-tight text-light-100">
                {piece.title}
              </h3>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-light-100/40 bg-light-100/10 text-light-100 backdrop-blur transition-colors group-hover:border-light-100 group-hover:bg-light-100 group-hover:text-dark-900">
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

const Home = async () => {
  const { products } = await getAllProducts({
    categorySlugs: [],
    genderSlugs: [],
    colorSlugs: [],
    sizeSlugs: [],
    priceRanges: [],
    sort: "newest",
    page: 1,
    limit: 3,
  });

  return (
    <main className="bg-light-100">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative isolate overflow-hidden bg-light-100"
      >
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Two models wearing Brillivo sterling silver earrings and a sculptural silver pendant necklace"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[64%_center] lg:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-light-100 via-light-100/90 to-light-100/25 sm:to-light-100/20 lg:via-light-100/70 lg:to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-20 sm:min-h-[620px] sm:px-6 sm:py-24 lg:min-h-[700px] lg:px-8">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-footnote uppercase tracking-[0.32em] text-silver-600">
              <span aria-hidden="true" className="h-px w-8 bg-silver-500" />
              The Signature Collection
            </p>

            <h1
              id="hero-heading"
              className="mt-6 text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.025em] text-dark-900"
            >
              Silver that
              <br className="hidden sm:block" /> speaks softly.
            </h1>

            <p className="mt-6 max-w-md text-body text-silver-700 sm:text-lead sm:font-normal">
              Hand-finished sterling silver jewelry with sculptural lines and quiet
              sparkle — pieces made to be lived in, layered and kept.
            </p>

            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-dark-900 px-7 text-caption uppercase tracking-[0.2em] text-light-100 transition-colors hover:bg-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2"
              >
                Shop the collection
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>

              <Link
                href="/products?category=rings"
                className="group inline-flex items-center gap-2 text-caption uppercase tracking-[0.2em] text-dark-900 transition-colors hover:text-silver-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2"
              >
                Explore rings
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <ul className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-footnote uppercase tracking-[0.22em] text-silver-600">
              <li>925 sterling silver</li>
              <li aria-hidden="true" className="hidden h-3 w-px bg-silver-300 sm:block" />
              <li>Hand-finished</li>
              <li aria-hidden="true" className="hidden h-3 w-px bg-silver-300 sm:block" />
              <li>Lifetime care</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Curated product row */}
      <section
        aria-labelledby="best-of-brillivo"
        className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8"
      >
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="best-of-brillivo" className="text-heading-3 text-dark-900">
            Best of Brillivo
          </h2>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-caption uppercase tracking-[0.18em] text-silver-600 transition-colors hover:text-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2"
          >
            Shop all
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {products.map((product) => {
            const price =
              product.minPrice !== null &&
              product.maxPrice !== null &&
              product.minPrice !== product.maxPrice
                ? `${formatPrice(product.minPrice)} – ${formatPrice(product.maxPrice)}`
                : formatPrice(product.minPrice);

            return (
              <Card
                key={product.id}
                title={product.name}
                subtitle={product.categoryName}
                meta={product.genderLabel}
                imageSrc={product.imageUrl}
                imageAlt={product.name}
                price={price}
                href={`/products/${product.id}`}
                defaultVariantId={product.defaultVariantId}
                wishlistProductId={product.id}
              />
            );
          })}
        </div>
      </section>

      {/* Trending Now */}
      <section
        aria-labelledby="trending-now"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="trending-now" className="text-heading-3 text-dark-900">
            Trending Now
          </h2>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-caption uppercase tracking-[0.18em] text-silver-600 transition-colors hover:text-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2"
          >
            View all jewelry
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <TrendingTile piece={TRENDING_PIECES[0]} featured />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <TrendingTile piece={TRENDING_PIECES[1]} />
            <TrendingTile piece={TRENDING_PIECES[2]} />
          </div>
        </div>
      </section>

      {/* Pre-footer campaign banner */}
      <section
        aria-labelledby="campaign-heading"
        className="relative isolate overflow-hidden bg-dark-900"
      >
        <div className="relative aspect-[16/10] w-full sm:absolute sm:inset-0 sm:aspect-auto">
          <Image
            src={CAMPAIGN_IMAGE}
            alt="Brillivo blue topaz ring in polished sterling silver against a black and silver sculptural backdrop"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/10 to-transparent sm:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-dark-900/95 via-dark-900/70 to-dark-900/25 sm:block" />
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center px-4 py-14 sm:min-h-[600px] sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-footnote uppercase tracking-[0.32em] text-silver-300">
              <span aria-hidden="true" className="h-px w-8 bg-silver-400" />
              The Blue Topaz Edit
            </p>

            <h2
              id="campaign-heading"
              className="mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-medium leading-[1] tracking-[-0.02em] text-light-100"
            >
              A ring worth
              <br /> remembering.
            </h2>

            <p className="mt-5 max-w-md text-body text-silver-300 sm:text-lead sm:font-normal">
              A hand-set blue topaz cradled in a twisted silver band, designed in the
              Brillivo atelier to mark the moments that matter.
            </p>

            <Link
              href="/products?category=rings"
              className="mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-light-100 px-7 text-caption uppercase tracking-[0.2em] text-dark-900 transition-colors hover:bg-silver-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-300] focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900"
            >
              Shop rings
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
