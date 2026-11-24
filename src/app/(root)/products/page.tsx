import type { Metadata } from "next";

import { ActiveFilters, Card, Filters, Sort } from "@/components";
import type { ActiveFilterBadge } from "@/components/ActiveFilters";
import { getAllProducts, getFilterFacets } from "@/lib/actions/product";
import { parseFilterParams } from "@/lib/utils/query";

export const metadata: Metadata = {
  title: "All Jewelry — Brillivo",
  description: "Explore Brillivo's collection of sterling silver rings, necklaces, bracelets and earrings.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function formatPriceRange(minPrice: number | null, maxPrice: number | null): string | undefined {
  if (minPrice === null && maxPrice === null) return undefined;
  if (minPrice !== null && maxPrice !== null && minPrice !== maxPrice) {
    return `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`;
  }
  return `$${(minPrice ?? maxPrice ?? 0).toFixed(2)}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilterParams(sp);

  const [listing, facets] = await Promise.all([
    getAllProducts(filters),
    getFilterFacets(),
  ]);

  const { products: items, totalCount, page, totalPages } = listing;

  const categoryNames = new Map(facets.categories.map((c) => [c.slug, c.name]));
  const genderLabels = new Map(facets.genders.map((g) => [g.slug, g.label]));
  const colorNames = new Map(facets.colors.map((c) => [c.slug, c.name]));
  const sizeNames = new Map(facets.sizes.map((s) => [s.slug, s.name]));

  const badges: ActiveFilterBadge[] = [];
  if (filters.search) badges.push({ key: "search", label: `Search: “${filters.search}”` });
  filters.categorySlugs.forEach((slug) =>
    badges.push({ key: "category", value: slug, label: categoryNames.get(slug) ?? slug })
  );
  filters.genderSlugs.forEach((slug) =>
    badges.push({ key: "gender", value: slug, label: genderLabels.get(slug) ?? slug })
  );
  filters.colorSlugs.forEach((slug) =>
    badges.push({ key: "color", value: slug, label: colorNames.get(slug) ?? slug })
  );
  filters.sizeSlugs.forEach((slug) =>
    badges.push({ key: "size", value: slug, label: sizeNames.get(slug) ?? slug })
  );
  filters.priceRanges.forEach((range) =>
    badges.push({ key: "price", value: range.id, label: range.label })
  );

  const headingCategory =
    filters.categorySlugs.length === 1
      ? categoryNames.get(filters.categorySlugs[0]) ?? "All Jewelry"
      : "All Jewelry";

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([key, value]) => {
      if (key === "page" || value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else params.append(key, value);
    });
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-light-300 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-footnote uppercase tracking-[0.28em] text-silver-600">Shop</p>
          <h1 className="mt-1 text-heading-2 text-dark-900">{headingCategory}</h1>
          <p className="mt-1 text-caption text-dark-700">
            {totalCount} {totalCount === 1 ? "piece" : "pieces"}
          </p>
        </div>
        <Sort />
      </header>

      <div className="mt-6">
        <ActiveFilters badges={badges} />
      </div>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
        <Filters
          facets={facets}
          active={{
            categorySlugs: filters.categorySlugs,
            genderSlugs: filters.genderSlugs,
            colorSlugs: filters.colorSlugs,
            sizeSlugs: filters.sizeSlugs,
            priceRanges: filters.priceRanges,
          }}
        />

        <div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-light-300 bg-light-100 p-12 text-center">
              <p className="text-body-medium text-dark-900">No pieces match your filters.</p>
              <p className="mt-1 text-caption text-dark-700">
                Try removing a filter or broadening your price range.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => (
                <Card
                  key={product.id}
                  title={product.name}
                  subtitle={product.categoryName}
                  meta={product.genderLabel}
                  imageSrc={product.imageUrl}
                  price={formatPriceRange(product.minPrice, product.maxPrice)}
                  href={`/products/${product.id}`}
                  defaultVariantId={product.defaultVariantId}
                  wishlistProductId={product.id}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav
              className="mt-6 flex items-center justify-center gap-2"
              aria-label="Pagination"
            >
              {page > 1 ? (
                <a
                  href={buildPageHref(page - 1)}
                  className="rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 hover:border-dark-500"
                >
                  Previous
                </a>
              ) : null}
              <span className="text-caption text-dark-700">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <a
                  href={buildPageHref(page + 1)}
                  className="rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 hover:border-dark-500"
                >
                  Next
                </a>
              ) : null}
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
