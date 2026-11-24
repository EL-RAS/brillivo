import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ChevronRight,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import {
  AddReviewForm,
  AddToBag,
  CollapsibleSection,
  ProductGallery,
  ProductReviews,
  RecommendedProducts,
  StarRating,
} from "@/components";
import type { FinishOption, PurchaseVariant } from "@/components/AddToBag";
import type { GallerySwatch } from "@/components/ProductGallery";
import { getProduct } from "@/lib/actions/product";
import { getCurrentUser } from "@/lib/auth/actions";
import type { ProductDetail, ProductVariantDetail } from "@/lib/actions/product";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const PLACEHOLDER_IMAGE = "/products/ring_01.jpg";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function isRingCategory(slug: string | undefined): boolean {
  return slug === "rings";
}

/** Cheapest variant — used for the headline price. */
function cheapestVariant(variants: ProductVariantDetail[]): ProductVariantDetail | undefined {
  return [...variants].sort((a, b) => a.price - b.price)[0];
}

function discountPercent(price: number, salePrice: number | null): number | undefined {
  if (salePrice === null || salePrice >= price) return undefined;
  return Math.round(((price - salePrice) / price) * 100);
}

/** Builds finish swatches and their images, keeping the first-seen order. */
function buildSwatches(product: ProductDetail): GallerySwatch[] {
  const swatches = new Map<string, GallerySwatch>();

  for (const variant of product.variants) {
    if (!variant.color) continue;
    const { name, slug, hexCode } = variant.color;
    if (!swatches.has(slug)) {
      swatches.set(slug, { id: slug, label: name, hexCode, images: [] });
    }
    const swatch = swatches.get(slug)!;
    for (const image of variant.images) {
      if (!swatch.images.includes(image.url)) swatch.images.push(image.url);
    }
  }

  // Fall back to the product-level image when a finish has no dedicated shot.
  const genericImages = product.images.map((image) => image.url);
  for (const swatch of swatches.values()) {
    if (swatch.images.length === 0) swatch.images = [...genericImages];
  }

  return [...swatches.values()];
}

function buildImages(product: ProductDetail): string[] {
  const urls = product.images.map((image) => image.url);
  return urls.length > 0 ? urls : [PLACEHOLDER_IMAGE];
}

/** Distinct finishes (colours/platings), first-seen order. */
function buildFinishes(product: ProductDetail): FinishOption[] {
  const finishes = new Map<string, FinishOption>();
  for (const variant of product.variants) {
    if (!variant.color) continue;
    if (!finishes.has(variant.color.slug)) {
      finishes.set(variant.color.slug, {
        slug: variant.color.slug,
        name: variant.color.name,
        hexCode: variant.color.hexCode,
      });
    }
  }
  return [...finishes.values()];
}

/** Distinct sizes (ring sizes / chain lengths), first-seen order. */
function buildSizes(product: ProductDetail): { slug: string; name: string }[] {
  const sizes = new Map<string, { slug: string; name: string }>();
  for (const variant of product.variants) {
    if (!variant.size) continue;
    if (!sizes.has(variant.size.slug)) {
      sizes.set(variant.size.slug, { slug: variant.size.slug, name: variant.size.name });
    }
  }
  return [...sizes.values()];
}

/** Serializable variant matrix for the client purchase island. */
function buildPurchaseVariants(product: ProductDetail): PurchaseVariant[] {
  return product.variants.map((variant) => ({
    id: variant.id,
    colorSlug: variant.color?.slug ?? null,
    sizeSlug: variant.size?.slug ?? null,
    inStock: variant.inStock,
  }));
}

const CARE_DETAILS = [
  { term: "Material", value: "925 Sterling Silver" },
  { term: "Finish", value: "High-polish, tarnish-resistant" },
  { term: "Hallmark", value: "Brillivo · 925" },
  { term: "Packaging", value: "Signature gift box & polishing cloth" },
];

/* -------------------------------------------------------------------------- */
/*  Not Found / Skeletons                                                      */
/* -------------------------------------------------------------------------- */

/** Styled fallback shown when a product id does not resolve. */
function ProductNotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-light-300 bg-light-200 text-silver-600">
        <PackageSearch className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-heading-2 text-dark-900">Piece not found</h1>
      <p className="mt-3 max-w-md text-body text-dark-700">
        The piece you are looking for may have sold out or moved. Explore the rest of
        the collection to find your next Brillivo treasure.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-dark-900 px-8 text-body-medium text-light-100 transition-colors hover:bg-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2"
      >
        Browse all jewelry
      </Link>
    </main>
  );
}

/** Placeholder shown while the reviews query resolves. */
function ReviewsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-20 animate-pulse rounded-2xl bg-light-200" />
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <div className="h-4 w-32 animate-pulse rounded-full bg-light-200" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-light-200" />
          <div className="h-3 w-full animate-pulse rounded-full bg-light-200" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-light-200" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder shown while the recommendations query resolves. */
function RecommendationsSkeleton() {
  return (
    <section className="mt-16" aria-hidden="true">
      <div className="h-7 w-56 animate-pulse rounded-full bg-light-200" />
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex flex-col overflow-hidden rounded-2xl border border-light-300">
            <div className="aspect-[4/5] animate-pulse bg-light-200" />
            <div className="flex flex-col gap-2 p-5">
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-light-200" />
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-light-200" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product not found — Brillivo" };
  }

  return {
    title: `${product.name} — Brillivo`,
    description:
      product.description ??
      `Discover the ${product.name}, hand-finished in 925 sterling silver by Brillivo.`,
  };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, currentUser] = await Promise.all([getProduct(id), getCurrentUser()]);

  if (!product) {
    return <ProductNotFound />;
  }

  const headlineVariant = cheapestVariant(product.variants);
  const headlinePrice = headlineVariant?.price ?? product.minPrice ?? 0;
  const headlineSale = headlineVariant?.salePrice ?? null;
  const discount = discountPercent(headlinePrice, headlineSale);
  const inStock = product.variants.some((variant) => variant.inStock > 0);

  const images = buildImages(product);
  const swatches = buildSwatches(product);
  const finishes = buildFinishes(product);
  const sizes = buildSizes(product);
  const purchaseVariants = buildPurchaseVariants(product);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-caption text-dark-700">
        <Link href="/" className="hover:text-dark-900">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href="/products" className="hover:text-dark-900">
          Jewelry
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-dark-900"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate text-dark-900">{product.name}</span>
      </nav>

      {/* Gallery + info */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={images} swatches={swatches} productName={product.name} />

        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {product.category && (
                <span className="rounded-full border border-light-300 px-3 py-1 text-footnote uppercase tracking-[0.28em] text-silver-600">
                  {product.category.name}
                </span>
              )}
              {discount !== undefined && (
                <span className="rounded-full bg-dark-900 px-3 py-1 text-footnote uppercase tracking-[0.18em] text-light-100">
                  {discount}% off
                </span>
              )}
            </div>
            <h1 className="text-heading-3 text-dark-900 sm:text-heading-2">{product.name}</h1>

            <div className="flex items-center gap-2">
              {product.reviewCount > 0 && product.ratingAverage !== null ? (
                <>
                  <StarRating value={product.ratingAverage} />
                  <span className="text-caption text-dark-700">
                    {product.ratingAverage.toFixed(1)}
                  </span>
                  <span className="text-caption text-dark-700">
                    · Reviews ({product.reviewCount})
                  </span>
                </>
              ) : (
                <>
                  <StarRating value={0} />
                  <span className="text-caption text-dark-700">No reviews yet</span>
                </>
              )}
              <span className="text-caption text-dark-700">
                {product.gender ? `· For ${product.gender.label} · ` : "· "}
                {inStock ? "In stock" : "Out of stock"}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-lead text-dark-900">{formatPrice(headlineSale ?? headlinePrice)}</span>
              {headlineSale !== null && (
                <span className="text-body text-dark-700 line-through">
                  {formatPrice(headlinePrice)}
                </span>
              )}
            </div>
          </header>

          {product.description && (
            <p className="text-body text-dark-700">{product.description}</p>
          )}

          <AddToBag
            productId={product.id}
            productName={product.name}
            variants={purchaseVariants}
            finishes={finishes}
            sizes={sizes}
            sizeLabel={isRingCategory(product.category?.slug) ? "Select Ring Size" : "Select Chain Length"}
            inStock={inStock}
          />

          {/* Reassurance badges */}
          <ul className="grid grid-cols-1 gap-3 rounded-2xl border border-light-300 bg-light-100 p-4 sm:grid-cols-3">
            <li className="flex items-center gap-2 text-caption text-dark-700">
              <Truck className="h-4 w-4 text-silver-600" aria-hidden="true" />
              Free shipping
            </li>
            <li className="flex items-center gap-2 text-caption text-dark-700">
              <ShieldCheck className="h-4 w-4 text-silver-600" aria-hidden="true" />
              2-year warranty
            </li>
            <li className="flex items-center gap-2 text-caption text-dark-700">
              <RotateCcw className="h-4 w-4 text-silver-600" aria-hidden="true" />
              30-day returns
            </li>
          </ul>
        </div>
      </section>

      {/* Collapsible information sections */}
      <section className="mx-auto mt-12 max-w-3xl">
        <CollapsibleSection title="Product Details" defaultOpen>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {CARE_DETAILS.map((detail) => (
              <div key={detail.term} className="flex justify-between gap-4 border-b border-light-300 py-2">
                <dt className="text-body-medium text-dark-900">{detail.term}</dt>
                <dd className="text-body text-dark-700">{detail.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex items-start gap-2 text-body text-dark-700">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-silver-600" aria-hidden="true" />
            Store your Brillivo piece in the supplied pouch and polish gently with the enclosed cloth to
            preserve its mirror finish.
          </p>
        </CollapsibleSection>

        <CollapsibleSection title="Shipping & Returns">
          <ul className="flex flex-col gap-2 text-body text-dark-700">
            <li>Complimentary insured shipping on all orders.</li>
            <li>Dispatched within 1–2 business days in signature Brillivo packaging.</li>
            <li>Free 30-day returns on unworn pieces with the original tags.</li>
            <li>Engraved and bespoke items are final sale.</li>
          </ul>
        </CollapsibleSection>

        <CollapsibleSection title="Reviews">
          <Suspense fallback={<ReviewsSkeleton />}>
            <ProductReviews productId={product.id} />
          </Suspense>
          <AddReviewForm productId={product.id} isAuthenticated={Boolean(currentUser)} />
        </CollapsibleSection>
      </section>

      {/* You might also like — streamed in, never blocks the main PDP */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <RecommendedProducts productId={product.id} />
      </Suspense>
    </main>
  );
}
