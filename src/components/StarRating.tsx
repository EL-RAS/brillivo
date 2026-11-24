import { Star } from "lucide-react";

/**
 * Read-only star rating with fractional support.
 *
 * Renders five base stars, then overlays a width-clipped filled copy so a score
 * like 4.5 fills exactly half of the fifth star (rather than rounding up).
 * Pure presentational/server-safe — no client hooks.
 */
export interface StarRatingProps {
  /** Score from 0–5. Values outside the range are clamped. */
  value: number;
  /** Star size. Defaults to `md`. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const STAR_SIZE: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "h-3.5 w-3.5 shrink-0",
  md: "h-4 w-4 shrink-0",
  lg: "h-5 w-5 shrink-0",
};

export default function StarRating({ value, size = "md", className = "" }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const percent = (clamped / 5) * 100;
  const starClass = STAR_SIZE[size];

  return (
    <span
      className={`relative inline-flex ${className}`}
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5`}
    >
      {/* Base (empty) stars */}
      <span className="flex items-center gap-0.5 text-silver-300" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className={starClass} fill="none" stroke="currentColor" />
        ))}
      </span>

      {/* Filled overlay, clipped to the score */}
      <span
        className="absolute inset-0 flex items-center gap-0.5 overflow-hidden text-[--color-silver-600]"
        style={{ width: `${percent}%` }}
        aria-hidden="true"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className={`${starClass} fill-current`} stroke="currentColor" />
        ))}
      </span>
    </span>
  );
}
