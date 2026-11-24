"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import {
  PRICE_RANGES,
  clearFilters,
  toggleArrayParam,
  type NormalizedProductFilters,
} from "@/lib/utils/query";

export type FiltersFacets = {
  categories: { name: string; slug: string; count: number }[];
  genders: { label: string; slug: string }[];
  colors: { name: string; slug: string; hexCode: string }[];
  sizes: { name: string; slug: string }[];
};

type GroupKey = "category" | "gender" | "color" | "size" | "price";

type FiltersProps = {
  facets: FiltersFacets;
  /** Active filters parsed on the server — keeps the client in sync with the URL. */
  active: Pick<
    NormalizedProductFilters,
    "categorySlugs" | "genderSlugs" | "colorSlugs" | "sizeSlugs" | "priceRanges"
  >;
};

export default function Filters({ facets, active }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => `?${searchParams.toString()}`, [searchParams]);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<GroupKey, boolean>>({
    category: true,
    gender: true,
    color: true,
    size: true,
    price: true,
  });

  useEffect(() => {
    setOpen(false);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const activeIds = useMemo<Record<GroupKey, string[]>>(
    () => ({
      category: active.categorySlugs,
      gender: active.genderSlugs,
      color: active.colorSlugs,
      size: active.sizeSlugs,
      price: active.priceRanges.map((range) => range.id),
    }),
    [active]
  );

  const activeCount = Object.values(activeIds).reduce((total, ids) => total + ids.length, 0);

  const onToggle = (key: GroupKey, value: string) => {
    router.push(toggleArrayParam(pathname, search, key, value), { scroll: false });
  };

  const onClear = () => {
    router.push(clearFilters(pathname, search), { scroll: false });
  };

  const Section = ({
    title,
    k,
    children,
  }: {
    title: string;
    k: GroupKey;
    children: ReactNode;
  }) => (
    <div className="border-b border-light-300 py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-body-medium text-dark-900"
        onClick={() => setExpanded((s) => ({ ...s, [k]: !s[k] }))}
        aria-expanded={expanded[k]}
        aria-controls={`filter-section-${k}`}
      >
        <span>
          {title}
          {activeIds[k].length > 0 && (
            <span className="ml-1 text-caption text-dark-700">({activeIds[k].length})</span>
          )}
        </span>
        <span className="text-caption text-dark-700">{expanded[k] ? "−" : "+"}</span>
      </button>
      {expanded[k] && (
        <div id={`filter-section-${k}`} className="mt-3">
          {children}
        </div>
      )}
    </div>
  );

  const Checkbox = ({
    id,
    label,
    checked,
    onChange,
    swatch,
  }: {
    id: string;
    label: string;
    checked: boolean;
    onChange: () => void;
    swatch?: string;
  }) => (
    <li className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 shrink-0 accent-dark-900"
        checked={checked}
        onChange={onChange}
      />
      {swatch && (
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-light-400"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
      )}
      <label htmlFor={id} className="text-body text-dark-900">
        {label}
      </label>
    </li>
  );

  const Panel = () => (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-body-medium text-dark-900">Filters</h3>
        {activeCount > 0 && (
          <button
            type="button"
            className="text-caption text-dark-700 underline"
            onClick={onClear}
          >
            Clear all
          </button>
        )}
      </div>

      {facets.categories.length > 0 && (
        <Section title="Category" k="category">
          <ul className="space-y-2">
            {facets.categories.map((category) => (
              <Checkbox
                key={category.slug}
                id={`filter-category-${category.slug}`}
                label={category.name}
                checked={activeIds.category.includes(category.slug)}
                onChange={() => onToggle("category", category.slug)}
              />
            ))}
          </ul>
        </Section>
      )}

      {facets.genders.length > 0 && (
        <Section title="Gender" k="gender">
          <ul className="space-y-2">
            {facets.genders.map((gender) => (
              <Checkbox
                key={gender.slug}
                id={`filter-gender-${gender.slug}`}
                label={gender.label}
                checked={activeIds.gender.includes(gender.slug)}
                onChange={() => onToggle("gender", gender.slug)}
              />
            ))}
          </ul>
        </Section>
      )}

      {facets.colors.length > 0 && (
        <Section title="Finish / Plating" k="color">
          <ul className="space-y-2">
            {facets.colors.map((color) => (
              <Checkbox
                key={color.slug}
                id={`filter-color-${color.slug}`}
                label={color.name}
                swatch={color.hexCode}
                checked={activeIds.color.includes(color.slug)}
                onChange={() => onToggle("color", color.slug)}
              />
            ))}
          </ul>
        </Section>
      )}

      {facets.sizes.length > 0 && (
        <Section title="Size" k="size">
          <ul className="grid grid-cols-2 gap-2">
            {facets.sizes.map((size) => (
              <Checkbox
                key={size.slug}
                id={`filter-size-${size.slug}`}
                label={size.name}
                checked={activeIds.size.includes(size.slug)}
                onChange={() => onToggle("size", size.slug)}
              />
            ))}
          </ul>
        </Section>
      )}

      <Section title="Price" k="price">
        <ul className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <Checkbox
              key={range.id}
              id={`filter-price-${range.id}`}
              label={range.label}
              checked={activeIds.price.includes(range.id)}
              onChange={() => onToggle("price", range.id)}
            />
          ))}
        </ul>
      </Section>
    </>
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between md:hidden">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-light-300 px-3 py-2 text-body-medium text-dark-900"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>

      <aside className="sticky top-20 hidden h-fit min-w-60 rounded-lg border border-light-300 bg-light-100 p-4 md:block">
        <Panel />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-light-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-light-300 p-4">
              <h3 className="text-body-medium text-dark-900">Filters</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="rounded-md p-1 text-dark-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-4 pb-6">
              <Panel />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
