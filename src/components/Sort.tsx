"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowUpDown } from "lucide-react";

import {
  DEFAULT_SORT,
  PRODUCT_SORTS,
  SORT_LABELS,
  resolveSort,
  setSort,
} from "@/lib/utils/query";

export default function Sort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => `?${searchParams.toString()}`, [searchParams]);

  const selected =
    resolveSort(searchParams.get("sortBy")) ??
    resolveSort(searchParams.get("sort")) ??
    DEFAULT_SORT;

  const onChange = (value: string) => {
    const sort = resolveSort(value);
    if (!sort) return;
    // Changing the sort order always resets pagination to page 1.
    router.push(setSort(pathname, search, sort), { scroll: false });
  };

  return (
    <label className="inline-flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-dark-700" aria-hidden="true" />
      <span className="text-body text-dark-900">Sort by</span>
      <select
        className="rounded-md border border-light-300 bg-light-100 px-3 py-2 text-body text-dark-900"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort products"
      >
        {PRODUCT_SORTS.map((value) => (
          <option key={value} value={value}>
            {SORT_LABELS[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
