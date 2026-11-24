import { and, asc, avg, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  categories,
  colors,
  genders,
  productImages,
  products,
  productVariants,
  reviews,
  sizes,
  user,
} from "@/lib/db/schema";
import type { NormalizedProductFilters, ProductSort } from "@/lib/utils/query";

/**
 * Server-only data access for Brillivo's product listing (PLP) and detail (PDP)
 * pages.
 *
 * Design notes
 * ------------
 * - These are plain server functions (not `"use server"` mutations): the listing
 *   is read during SSR, so exposing it as a POST action endpoint would be wasteful.
 * - List queries use a single round-trip: scalar sub-queries aggregate the price
 *   range and pick the top image, while `exists` sub-queries apply variant facets.
 *   No N+1 fan-out, no client-side joins.
 * - When a colour/plating filter is active we surface that colour's variant image
 *   ("color-specific image"); otherwise the product's generic primary image wins.
 */

const PLACEHOLDER_IMAGE = "/products/ring_01.jpg";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ProductListItem = {
  id: string;
  name: string;
  description: string | null;
  categoryName: string;
  categorySlug: string;
  genderLabel: string;
  genderSlug: string;
  imageUrl: string;
  minPrice: number | null;
  maxPrice: number | null;
  /**
   * Cheapest in-stock variant, used for one-click "Add to cart" from the PLP.
   * `null` when the product has no purchasable stock.
   */
  defaultVariantId: string | null;
};

export type ProductListing = {
  products: ProductListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type FilterFacets = {
  categories: { name: string; slug: string; count: number }[];
  genders: { label: string; slug: string }[];
  colors: { name: string; slug: string; hexCode: string }[];
  sizes: { name: string; slug: string }[];
};

export type ProductVariantDetail = {
  id: string;
  sku: string;
  price: number;
  salePrice: number | null;
  inStock: number;
  weight: number;
  dimensions: { length: number; width: number; height: number } | null;
  color: { id: string; name: string; slug: string; hexCode: string } | null;
  size: { id: string; name: string; slug: string } | null;
  images: { id: string; url: string; isPrimary: boolean; sortOrder: number }[];
};

export type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; slug: string } | null;
  gender: { id: string; label: string; slug: string } | null;
  variants: ProductVariantDetail[];
  images: { id: string; url: string; isPrimary: boolean; sortOrder: number; variantId: string | null }[];
  minPrice: number | null;
  maxPrice: number | null;
  /** Average review score (1–5), or `null` when the piece has no reviews. */
  ratingAverage: number | null;
  /** Total number of reviews for the piece. */
  reviewCount: number;
};

/** A single customer review for a product. */
export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
};

/** Aggregated review stats for a product, derived from the `reviews` table. */
export type ProductRating = {
  averageRating: number | null;
  reviewCount: number;
};

/** A lightweight card payload for the "You Might Also Like" rail. */
export type RecommendedProduct = {
  id: string;
  name: string;
  price: number | null;
  imageUrl: string;
};

/** The full `getRecommendedProducts` payload, including the average rating. */
export type RecommendationResult = {
  products: RecommendedProduct[];
  averageRating: number | null;
  reviewCount: number;
};

/* -------------------------------------------------------------------------- */
/*  SQL fragments                                                              */
/* -------------------------------------------------------------------------- */

const minPriceSql = sql<string | null>`(
  select min(${productVariants.price})
  from ${productVariants}
  where ${productVariants.productId} = ${products.id}
)`;

const maxPriceSql = sql<string | null>`(
  select max(${productVariants.price})
  from ${productVariants}
  where ${productVariants.productId} = ${products.id}
)`;

function toPrice(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Builds the "best image" scalar sub-query.
 *
 * - With an active colour filter, prefer images attached to a variant of that
 *   colour, then fall back to the generic (variant-less) primary image.
 * - Without a colour filter, prefer the generic primary image, then any image.
 */
function buildTopImageSql(colorSlugs: string[]): SQL<string | null> {
  const colorPreference =
    colorSlugs.length > 0
      ? sql`case
            when exists (
              select 1 from ${productVariants}
              inner join ${colors} on ${colors.id} = ${productVariants.colorId}
              where ${productVariants.id} = ${productImages.variantId}
              and ${inArray(colors.slug, colorSlugs)}
            ) then 0
            when ${productImages.variantId} is null then 1
            else 2
          end`
      : sql`case when ${productImages.variantId} is null then 0 else 1 end`;

  return sql<string | null>`(
    select ${productImages.url}
    from ${productImages}
    where ${productImages.productId} = ${products.id}
    order by
      ${colorPreference} asc,
      ${productImages.isPrimary} desc,
      ${productImages.sortOrder} asc
    limit 1
  )`;
}

/* -------------------------------------------------------------------------- */
/*  Filtering / sorting                                                        */
/* -------------------------------------------------------------------------- */

function buildConditions(filters: NormalizedProductFilters): SQL[] {
  const conditions: SQL[] = [eq(products.isPublished, true)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    const searchCondition = or(
      ilike(products.name, term),
      ilike(products.description, term)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (filters.categorySlugs.length) {
    conditions.push(inArray(categories.slug, filters.categorySlugs));
  }

  if (filters.genderSlugs.length) {
    conditions.push(inArray(genders.slug, filters.genderSlugs));
  }

  if (filters.colorSlugs.length) {
    conditions.push(sql`exists (
      select 1 from ${productVariants}
      inner join ${colors} on ${colors.id} = ${productVariants.colorId}
      where ${productVariants.productId} = ${products.id}
      and ${inArray(colors.slug, filters.colorSlugs)}
    )`);
  }

  if (filters.sizeSlugs.length) {
    conditions.push(sql`exists (
      select 1 from ${productVariants}
      inner join ${sizes} on ${sizes.id} = ${productVariants.sizeId}
      where ${productVariants.productId} = ${products.id}
      and ${inArray(sizes.slug, filters.sizeSlugs)}
    )`);
  }

  // Bucket selections are OR-ed together (e.g. "$100–200" OR "$200–300").
  const bucketConditions: SQL[] = filters.priceRanges.map((range) => {
    const parts: SQL[] = [];
    if (range.min !== undefined) parts.push(sql`${productVariants.price} >= ${range.min}`);
    if (range.max !== undefined) parts.push(sql`${productVariants.price} < ${range.max}`);
    return parts.length > 1 ? sql`(${sql.join(parts, sql` and `)})` : parts[0];
  });

  // A continuous priceMin/priceMax range is a single AND-ed predicate.
  const boundConditions: SQL[] = [];
  if (filters.priceMin !== undefined) {
    boundConditions.push(sql`${productVariants.price} >= ${filters.priceMin}`);
  }
  if (filters.priceMax !== undefined) {
    boundConditions.push(sql`${productVariants.price} <= ${filters.priceMax}`);
  }
  if (boundConditions.length) {
    bucketConditions.push(sql`(${sql.join(boundConditions, sql` and `)})`);
  }

  if (bucketConditions.length) {
    conditions.push(sql`exists (
      select 1 from ${productVariants}
      where ${productVariants.productId} = ${products.id}
      and (${sql.join(bucketConditions, sql` or `)})
    )`);
  }

  return conditions;
}

function buildOrderBy(sort: ProductSort): SQL[] {
  switch (sort) {
    case "price_asc":
      return [sql`${minPriceSql} asc nulls last`, asc(products.name)];
    case "price_desc":
      return [sql`${maxPriceSql} desc nulls last`, asc(products.name)];
    case "newest":
    case "featured":
    default:
      return [desc(products.createdAt), asc(products.name)];
  }
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function getAllProducts(
  filters: NormalizedProductFilters
): Promise<ProductListing> {
  const where = and(...buildConditions(filters));
  const offset = (filters.page - 1) * filters.limit;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        categoryName: categories.name,
        categorySlug: categories.slug,
        genderLabel: genders.label,
        genderSlug: genders.slug,
        imageUrl: buildTopImageSql(filters.colorSlugs),
        minPrice: minPriceSql,
        maxPrice: maxPriceSql,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(genders, eq(products.genderId, genders.id))
      .where(where)
      .orderBy(...buildOrderBy(filters.sort))
      .limit(filters.limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(genders, eq(products.genderId, genders.id))
      .where(where),
  ]);

  const totalCount = countRows[0]?.value ?? 0;

  // Resolve a default (cheapest, in-stock) variant per product for one-click
  // add-to-cart. Done as a single batched `inArray` query — a correlated scalar
  // sub-query inside a bare single-table select binds to the wrong table in
  // Drizzle (unqualified columns) and silently returns null.
  const productIds = rows.map((row) => row.id);
  const variantRows = productIds.length
    ? await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          price: productVariants.price,
          salePrice: productVariants.salePrice,
          inStock: productVariants.inStock,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds))
        .orderBy(asc(productVariants.price))
    : [];

  const defaultVariantByProduct = new Map<string, string>();
  const inStockFallback = new Map<string, string>();
  for (const variant of variantRows) {
    if (!defaultVariantByProduct.has(variant.productId)) {
      if (variant.inStock > 0) {
        defaultVariantByProduct.set(variant.productId, variant.id);
      } else if (!inStockFallback.has(variant.productId)) {
        inStockFallback.set(variant.productId, variant.id);
      }
    }
  }

  const items: ProductListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    genderLabel: row.genderLabel,
    genderSlug: row.genderSlug,
    imageUrl: row.imageUrl ?? PLACEHOLDER_IMAGE,
    minPrice: toPrice(row.minPrice),
    maxPrice: toPrice(row.maxPrice),
    defaultVariantId:
      defaultVariantByProduct.get(row.id) ?? inStockFallback.get(row.id) ?? null,
  }));

  return {
    products: items,
    totalCount,
    page: filters.page,
    pageSize: filters.limit,
    totalPages: Math.max(1, Math.ceil(totalCount / filters.limit)),
  };
}

/**
 * Full PDP payload. Uses Drizzle's relational query API so variants, their
 * colour/size and images (plus the product's images, category and gender) are
 * loaded in a single batched request instead of fan-out N+1 queries.
 */
export async function getProduct(productId: string): Promise<ProductDetail | null> {
  const [product, rating] = await Promise.all([
    db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        category: { columns: { id: true, name: true, slug: true } },
        gender: { columns: { id: true, label: true, slug: true } },
        images: {
          columns: { id: true, url: true, isPrimary: true, sortOrder: true, variantId: true },
          orderBy: [desc(productImages.isPrimary), asc(productImages.sortOrder)],
        },
        variants: {
          with: {
            color: { columns: { id: true, name: true, slug: true, hexCode: true } },
            size: { columns: { id: true, name: true, slug: true } },
            images: {
              columns: { id: true, url: true, isPrimary: true, sortOrder: true },
              orderBy: [desc(productImages.isPrimary), asc(productImages.sortOrder)],
            },
          },
        },
      },
    }),
    getProductRating(productId),
  ]);

  if (!product) return null;

  const variants: ProductVariantDetail[] = product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    price: toPrice(variant.price) ?? 0,
    salePrice: toPrice(variant.salePrice),
    inStock: variant.inStock,
    weight: variant.weight,
    dimensions: variant.dimensions ?? null,
    color: variant.color ?? null,
    size: variant.size ?? null,
    images: variant.images.map((image) => ({
      id: image.id,
      url: image.url,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
    })),
  }));

  const prices = variants.map((variant) => variant.price).filter((p) => Number.isFinite(p));

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    isPublished: product.isPublished,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    category: product.category ?? null,
    gender: product.gender ?? null,
    variants,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
      variantId: image.variantId,
    })),
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    ratingAverage: rating.averageRating,
    reviewCount: rating.reviewCount,
  };
}

export async function getFilterFacets(): Promise<FilterFacets> {
  const [categoryRows, genderRows, colorRows, sizeRows] = await Promise.all([
    db
      .select({
        name: categories.name,
        slug: categories.slug,
        count: count(products.id),
      })
      .from(categories)
      .leftJoin(
        products,
        and(eq(products.categoryId, categories.id), eq(products.isPublished, true))
      )
      .groupBy(categories.id, categories.name, categories.slug)
      .orderBy(asc(categories.name)),
    db
      .select({ label: genders.label, slug: genders.slug })
      .from(genders)
      .orderBy(asc(genders.label)),
    db
      .select({ name: colors.name, slug: colors.slug, hexCode: colors.hexCode })
      .from(colors)
      .orderBy(asc(colors.name)),
    db
      .select({ name: sizes.name, slug: sizes.slug })
      .from(sizes)
      .where(sql`${sizes.slug} <> 'one-size'`)
      .orderBy(asc(sizes.sortOrder), asc(sizes.name)),
  ]);

  return {
    categories: categoryRows,
    genders: genderRows,
    colors: colorRows,
    sizes: sizeRows,
  };
}

/* -------------------------------------------------------------------------- */
/*  Reviews                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Aggregate rating for a product, computed straight from the `reviews` table.
 *
 * Runs a single `AVG(rating)` + `COUNT(*)` aggregation so the PDP header can show
 * the real score and review count without loading every review row. Returns
 * `averageRating: null` (and `reviewCount: 0`) when the piece has no reviews.
 */
export async function getProductRating(productId: string): Promise<ProductRating> {
  const [row] = await db
    .select({
      average: avg(reviews.rating),
      total: count(),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  const total = Number(row?.total ?? 0);
  const average = row?.average === null || row?.average === undefined ? null : Number(row.average);

  return {
    averageRating: total > 0 && average !== null ? average : null,
    reviewCount: total,
  };
}

/**
 * Approved reviews for a product, newest first.
 *
 * The schema has no moderation column, so every persisted review is treated as
 * approved. Author names fall back to a neutral label when the account has no
 * display name. `comment` is surfaced as `content`; `title` is omitted because
 * the schema does not store one.
 */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: user.name,
    })
    .from(reviews)
    .innerJoin(user, eq(reviews.userId, user.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

  return rows.map((row) => ({
    id: row.id,
    author: row.authorName?.trim() || "Verified Buyer",
    rating: row.rating,
    content: row.comment?.trim() || "No comment provided.",
    createdAt: row.createdAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Recommendations                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Related silver jewelry for the "You Might Also Like" rail.
 *
 * Prefers the same category + gender, broadening to category-only and then to
 * any published product when the narrow set is too small. Products without an
 * image are silently skipped so the rail never renders a broken card.
 *
 * Images are resolved in a single batched `inArray` query rather than a
 * correlated scalar sub-query: Drizzle renders unqualified column names for
 * single-table selects, which makes a correlated `= products.id` predicate bind
 * to the inner table and silently return null.
 */
export async function getRecommendedProducts(
  productId: string,
  limit = 6
): Promise<RecommendationResult> {
  const [current] = await db
    .select({
      categoryId: products.categoryId,
      genderId: products.genderId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!current) {
    return { products: [], averageRating: null, reviewCount: 0 };
  }

  const scopes: (SQL | undefined)[] = [];

  if (current.categoryId && current.genderId) {
    scopes.push(
      and(eq(products.categoryId, current.categoryId), eq(products.genderId, current.genderId))
    );
  }
  if (current.categoryId) {
    scopes.push(eq(products.categoryId, current.categoryId));
  }

  const candidates: { id: string; name: string }[] = [];
  const seen = new Set<string>([productId]);

  const collect = async (scope?: SQL) => {
    if (candidates.length >= limit * 3) return;
    const where = scope ? and(eq(products.isPublished, true), scope) : eq(products.isPublished, true);

    const rows = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt), asc(products.name))
      .limit(limit * 3 + seen.size);

    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      candidates.push(row);
    }
  };

  for (const scope of scopes) {
    await collect(scope);
  }
  if (candidates.length < limit) {
    await collect(undefined);
  }

  if (candidates.length === 0) {
    return { products: [], averageRating: null, reviewCount: 0 };
  }

  const ids = candidates.map((candidate) => candidate.id);

  const [imageRows, priceRows] = await Promise.all([
    db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        isPrimary: productImages.isPrimary,
        sortOrder: productImages.sortOrder,
      })
      .from(productImages)
      .where(inArray(productImages.productId, ids)),
    db
      .select({
        productId: productVariants.productId,
        minPrice: sql<string | null>`min(${productVariants.price})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, ids))
      .groupBy(productVariants.productId),
  ]);

  const priceByProduct = new Map<string, number | null>();
  for (const row of priceRows) {
    priceByProduct.set(row.productId, toPrice(row.minPrice));
  }

  // Pick the best image per product (primary first, then sort order).
  const bestImage = new Map<string, { url: string; isPrimary: boolean; sortOrder: number }>();
  for (const image of imageRows) {
    const current = bestImage.get(image.productId);
    const isBetter =
      !current ||
      (image.isPrimary && !current.isPrimary) ||
      (image.isPrimary === current.isPrimary && image.sortOrder < current.sortOrder);
    if (isBetter) {
      bestImage.set(image.productId, {
        url: image.url,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      });
    }
  }

  const recommended: RecommendedProduct[] = [];
  for (const candidate of candidates) {
    if (recommended.length >= limit) break;
    const image = bestImage.get(candidate.id);
    if (!image) continue; // skip products with no usable image
    recommended.push({
      id: candidate.id,
      name: candidate.name,
      price: priceByProduct.get(candidate.id) ?? null,
      imageUrl: image.url,
    });
  }

  const [aggregate] = await db
    .select({
      average: sql<string | null>`avg(${reviews.rating})`,
      count: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  const reviewCount = aggregate?.count ?? 0;
  const averageRating =
    reviewCount > 0 && aggregate?.average ? Number(aggregate.average) : null;

  return { products: recommended, averageRating, reviewCount };
}
