"use client";

import { useRef, useState } from "react";

/**
 * Client-side jewellery size / length picker.
 *
 * Works both as a controlled component (parent owns `selectedId` and receives
 * `onSelect`) and as a self-contained uncontrolled component (no props beyond
 * `label`/`options`) so it can be rendered directly from a server component.
 * Supports arrow-key navigation within the option grid.
 */

export type SizeOption = {
  id: string;
  label: string;
  /** Optional stock hint used to disable out-of-stock options. */
  disabled?: boolean;
};

export interface SizePickerProps {
  /** Section heading, e.g. "Select Ring Size" or "Select Chain Length". */
  label: string;
  options: SizeOption[];
  /** Controlled selection. When omitted the component manages its own state. */
  selectedId?: string;
  /** Controlled change handler. When omitted the component manages its own state. */
  onSelect?: (id: string) => void;
  /** Optional helper link rendered on the right (e.g. "Size Guide"). */
  guideHref?: string;
}

export default function SizePicker({
  label,
  options,
  selectedId,
  onSelect,
  guideHref = "#size-guide",
}: SizePickerProps) {
  const [internalId, setInternalId] = useState<string | undefined>(undefined);
  const activeId = selectedId ?? internalId;

  const select = (id: string) => {
    if (onSelect) {
      onSelect(id);
    } else {
      setInternalId((current) => (current === id ? undefined : id));
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const focusOption = (index: number) => {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>(
      "button[data-size-option]"
    );
    buttons?.[index]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(Math.max(index - 1, 0));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-body-medium text-dark-900">{label}</p>
        <a
          href={guideHref}
          className="text-caption text-dark-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500"
        >
          Size Guide
        </a>
      </div>

      <div ref={containerRef} role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {options.map((option, index) => {
          const isActive = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              data-size-option
              role="radio"
              aria-checked={isActive}
              disabled={option.disabled}
              tabIndex={isActive || (!activeId && index === 0) ? 0 : -1}
              onClick={() => select(option.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`rounded-lg border px-2 py-3 text-center text-body transition focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 disabled:cursor-not-allowed disabled:border-light-300 disabled:text-silver-400 disabled:line-through ${
                isActive
                  ? "border-dark-900 text-dark-900"
                  : "border-light-300 text-dark-700 hover:border-silver-400"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
