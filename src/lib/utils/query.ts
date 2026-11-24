import qs from "query-string";

/**
 * Pure URL/query-string helpers for the product listing page.
 *
 * The listing state lives entirely in the URL so that results stay
 * server-rendered, shareable and back/forward friendly. Nothing in here
 * touches React, the router or the database, which keeps every function
 * trivially unit-testable.
 */

type QueryValue = string | string[] | number | number[] | null | undefined;
type QueryObject = Record<string, QueryValue>;

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const PRODUCT_SORTS = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
/**
 * Default sort is newest-first (`created_at DESC`). `featured` remains available
 * as an alias handled identically to `newest` so curated listings stay stable.
 */
export const DEFAULT_SORT: ProductSort = "newest";

export const SORT_LABELS: Record<ProductSort, string> = {
  featured: "Featured",
  newest: "Newest",
  price_desc: "Price: High → Low",
  price_asc: "Price: Low → High",
};

/** Public URL aliases → canonical sort. `latest` is the SEO-friendly spelling of `newest`. */
const SORT_ALIASES: Record<string, ProductSort> = {
  featured: "featured",
  newest: "newest",
  latest: "newest",
  price_asc: "price_asc",
  price_desc: "price_desc",
};

export function resolveSort(value: unknown): ProductSort | undefined {
  if (typeof value !== "string") return undefined;
  return SORT_ALIASES[value.toLowerCase()];
}

export const DEFAULT_PAGE_SIZE = 24;

export type PriceRange = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

/** Presentation-only price buckets shared by the parser and the Filters UI. */
export const PRICE_RANGES: readonly PriceRange[] = [
  { id: "0-100", label: "Under $100", max: 100 },
  { id: "100-200", label: "$100 – $200", min: 100, max: 200 },
  { id: "200-300", label: "$200 – $300", min: 200, max: 300 },
  { id: "300-", label: "$300+", min: 300 },
];

export type NormalizedProductFilters = {
  search?: string;
  categorySlugs: string[];
  genderSlugs: string[];
  colorSlugs: string[];
  sizeSlugs: string[];
  priceRanges: PriceRange[];
  priceMin?: number;
  priceMax?: number;
  sort: ProductSort;
  page: number;
  limit: number;
};

export type SearchParamsInput = Record<string, string | string[] | undefined>;

/* -------------------------------------------------------------------------- */
/*  Primitive parsing / serialising                                            */
/* -------------------------------------------------------------------------- */

export function parseQuery(search: string): QueryObject {
  return qs.parse(search, { arrayFormat: "bracket" }) as QueryObject;
}

export function stringifyQuery(query: QueryObject): string {
  return qs.stringify(query, {
    skipNull: true,
    skipEmptyString: true,
    arrayFormat: "bracket",
  });
}

export function getArrayParam(search: string, key: string): string[] {
  const q = parseQuery(search);
  const value = q[key];
  if (Array.isArray(value)) return value.map(String);
  if (value === undefined || value === null) return [];
  return [String(value)];
}

export function getStringParam(search: string, key: string): string | undefined {
  const q = parseQuery(search);
  const value = q[key];
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? (value[0] ? String(value[0]) : undefined) : String(value);
}

/* -------------------------------------------------------------------------- */
/*  URL builders (consumed by the client Filter/Sort components)               */
/* -------------------------------------------------------------------------- */

export function toQueryString(query: QueryObject): string {
  const search = stringifyQuery(query);
  return search ? `?${search}` : "";
}

export function withUpdatedParams(
  pathname: string,
  currentSearch: string,
  updates: QueryObject
): string {
  const next: QueryObject = { ...parseQuery(currentSearch) };

  for (const [key, value] of Object.entries(updates)) {
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    if (value === undefined || value === null || isEmptyArray) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }

  return `${pathname}${toQueryString(next)}`;
}

export function setParam(
  pathname: string,
  currentSearch: string,
  key: string,
  value: string | number | null | undefined
): string {
  return withUpdatedParams(pathname, currentSearch, {
    [key]: value === null || value === undefined ? undefined : String(value),
  });
}

export function removeParams(
  pathname: string,
  currentSearch: string,
  keys: string[]
): string {
  const next: QueryObject = { ...parseQuery(currentSearch) };
  for (const key of keys) delete next[key];
  return `${pathname}${toQueryString(next)}`;
}

/**
 * Add `value` to a multi-select param when absent, or remove it when present.
 * Any change resets pagination back to the first page.
 */
export function toggleArrayParam(
  pathname: string,
  currentSearch: string,
  key: string,
  value: string
): string {
  const current = parseQuery(currentSearch);
  const values = new Set<string>(toArray(current[key]));
  if (values.has(value)) values.delete(value);
  else values.add(value);

  const nextValues = Array.from(values);
  return withUpdatedParams(pathname, currentSearch, {
    [key]: nextValues.length ? nextValues : undefined,
    page: undefined,
  });
}

/** Remove every filter (keeps search + sort) and reset pagination. */
export function clearFilters(pathname: string, currentSearch: string): string {
  const current = parseQuery(currentSearch);
  return withUpdatedParams(pathname, currentSearch, {
    category: undefined,
    gender: undefined,
    color: undefined,
    size: undefined,
    price: undefined,
    page: undefined,
  }) + (current.search ? "" : "");
}

/** Change sort order and reset pagination to page 1. */
export function setSort(
  pathname: string,
  currentSearch: string,
  sort: ProductSort
): string {
  return withUpdatedParams(pathname, currentSearch, {
    sort: sort === DEFAULT_SORT ? undefined : sort,
    sortBy: undefined,
    page: undefined,
  });
}

export function buildProductsHref(
  pathname: string,
  updates: QueryObject,
  currentSearch = ""
): string {
  return withUpdatedParams(pathname, currentSearch, updates);
}

/* -------------------------------------------------------------------------- */
/*  Normalisation (server page)                                                */
/* -------------------------------------------------------------------------- */

function toArray(value: QueryValue | string | string[]): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value === undefined || value === null) return [];
  return [String(value)];
}

function readSlugs(sp: SearchParamsInput, key: string): string[] {
  const merged = [...toArray(sp[key]), ...toArray(sp[`${key}[]`])];
  return Array.from(new Set(merged.map((v) => v.trim().toLowerCase()).filter(Boolean)));
}

function readString(sp: SearchParamsInput, key: string): string | undefined {
  const value = sp[key] ?? sp[`${key}[]`];
  if (value === undefined) return undefined;
  const first = Array.isArray(value) ? value[0] : value;
  return first ? String(first) : undefined;
}

function toFiniteNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function isProductSort(value: unknown): value is ProductSort {
  return resolveSort(value) !== undefined;
}

export function resolvePriceRanges(ids: string[]): PriceRange[] {
  const byId = new Map(PRICE_RANGES.map((range) => [range.id, range]));
  return ids
    .map((id) => byId.get(id))
    .filter((range): range is PriceRange => Boolean(range));
}

export function parseFilterParams(sp: SearchParamsInput): NormalizedProductFilters {
  const search = readString(sp, "search")?.trim() || undefined;

  const sort: ProductSort =
    resolveSort(readString(sp, "sortBy")) ??
    resolveSort(readString(sp, "sort")) ??
    DEFAULT_SORT;

  const pageRaw = Number(readString(sp, "page") ?? 1);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const limitRaw = Number(readString(sp, "limit") ?? DEFAULT_PAGE_SIZE);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0
    ? Math.min(Math.floor(limitRaw), 60)
    : DEFAULT_PAGE_SIZE;

  const priceMin = toFiniteNumber(readString(sp, "priceMin"));
  const priceMax = toFiniteNumber(readString(sp, "priceMax"));

  return {
    search,
    categorySlugs: readSlugs(sp, "category"),
    genderSlugs: readSlugs(sp, "gender"),
    colorSlugs: readSlugs(sp, "color"),
    sizeSlugs: readSlugs(sp, "size"),
    priceRanges: resolvePriceRanges(readSlugs(sp, "price")),
    priceMin,
    priceMax,
    sort,
    page,
    limit,
  };
}

export function buildProductQueryObject(
  filters: NormalizedProductFilters
): Record<string, string | string[] | undefined> {
  const query: Record<string, string | string[] | undefined> = {};
  if (filters.search) query.search = filters.search;
  if (filters.categorySlugs.length) query.category = filters.categorySlugs;
  if (filters.genderSlugs.length) query.gender = filters.genderSlugs;
  if (filters.colorSlugs.length) query.color = filters.colorSlugs;
  if (filters.sizeSlugs.length) query.size = filters.sizeSlugs;
  if (filters.priceRanges.length) query.price = filters.priceRanges.map((r) => r.id);
  if (filters.priceMin !== undefined) query.priceMin = String(filters.priceMin);
  if (filters.priceMax !== undefined) query.priceMax = String(filters.priceMax);
  if (filters.sort !== DEFAULT_SORT) query.sort = filters.sort;
  if (filters.page > 1) query.page = String(filters.page);
  return query;
}
