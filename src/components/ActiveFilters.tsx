"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { X } from "lucide-react";

import {
  clearFilters,
  removeParams,
  toggleArrayParam,
} from "@/lib/utils/query";

export type ActiveFilterBadge = {
  /** Query-string key, e.g. "category", "price", "search". */
  key: string;
  /** Value to remove/toggle off — omitted for single-value params like search. */
  value?: string;
  label: string;
};

type ActiveFiltersProps = {
  badges: ActiveFilterBadge[];
};

export default function ActiveFilters({ badges }: ActiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => `?${searchParams.toString()}`, [searchParams]);

  if (badges.length === 0) return null;

  const onRemove = (badge: ActiveFilterBadge) => {
    const url = badge.value
      ? toggleArrayParam(pathname, search, badge.key, badge.value)
      : removeParams(pathname, search, [badge.key, "page"]);
    router.push(url, { scroll: false });
  };

  const onClearAll = () => {
    router.push(clearFilters(pathname, search), { scroll: false });
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-caption text-dark-700">Applied:</span>
      {badges.map((badge) => (
        <button
          key={`${badge.key}-${badge.value ?? "value"}`}
          type="button"
          onClick={() => onRemove(badge)}
          className="inline-flex items-center gap-1 rounded-full border border-light-300 bg-light-100 px-3 py-1 text-caption text-dark-900 transition-colors hover:border-dark-500"
          aria-label={`Remove filter ${badge.label}`}
        >
          {badge.label}
          <X className="h-3.5 w-3.5 text-dark-700" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-caption text-dark-700 underline"
      >
        Clear all
      </button>
    </div>
  );
}
