"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export type BadgeTone = "agua" | "dark" | "light";

export interface CardProps {
  id?: string | number;
  title: string;
  description?: string;
  category?: string;
  imageSrc: string;
  imageAlt?: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  badge?: string | null;
  badgeTone?: BadgeTone;
  meta?: string;
  href?: string;
  onClick?: () => void;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
}

function formatJewelryPrice(value: number | string): string {
  if (typeof value === "string") {
    return value;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function Card({
  title,
  description,
  category,
  imageSrc,
  imageAlt,
  price,
  compareAtPrice,
  badge,
  badgeTone = "agua",
  meta,
  href,
  onClick,
  actionLabel,
  onActionClick,
  className = "",
}: CardProps) {
  const formattedPrice = formatJewelryPrice(price);
  const formattedCompareAt =
    compareAtPrice !== undefined && compareAtPrice !== null
      ? formatJewelryPrice(compareAtPrice)
      : null;

  const badgeToneClasses: Record<BadgeTone, string> = {
    agua: "bg-[var(--light)] text-[var(--agua)] border border-[var(--agua)]/30",
    dark: "bg-[var(--dark)] text-[var(--light)]",
    light: "bg-[var(--light)] text-[var(--dark)] border border-[var(--gray)]",
  };

  const CardBody = (
    <>
      {/* Product Visual Container (Matches reference aspect ratio & pill badge placement) */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--gray)]/25">
        <Image
          src={imageSrc}
          alt={imageAlt || title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {badge && (
          <span
            className={`absolute top-4 left-4 z-10 inline-flex items-center rounded-full px-3.5 py-1 text-caption font-medium shadow-sm ${badgeToneClasses[badgeTone]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Product Details Below Image (Matches structural hierarchy: Title + Price row, Category/Description row, Meta/Finish row) */}
      <div className="flex flex-1 flex-col justify-between pt-4 pb-2 bg-[var(--light)] text-[var(--dark)] font-jost">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-body-medium font-medium text-[var(--dark)] transition-colors duration-200 group-hover:text-[var(--agua)] line-clamp-1">
              {title}
            </h3>
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="text-body-medium font-medium text-[var(--dark)]">
                {formattedPrice}
              </span>
              {formattedCompareAt && (
                <span className="text-footnote text-[var(--dark)]/45 line-through">
                  {formattedCompareAt}
                </span>
              )}
            </div>
          </div>

          {(description || category) && (
            <p className="mt-1 text-body text-[var(--dark)]/65 line-clamp-1">
              {description || category}
            </p>
          )}

          {meta && (
            <p className="mt-0.5 text-caption text-[var(--dark)]/55">
              {meta}
            </p>
          )}
        </div>

        {actionLabel && onActionClick && (
          <div className="mt-4 pt-3 border-t border-[var(--gray)]/40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onActionClick();
              }}
              className="w-full rounded-full bg-[var(--dark)] px-4 py-2 text-caption font-medium text-[var(--light)] transition-colors duration-200 hover:bg-[var(--agua)] hover:text-[var(--dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] cursor-pointer"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <article
        className={`group flex flex-col bg-[var(--light)] font-jost ${className}`}
      >
        <Link
          href={href}
          onClick={onClick}
          className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-sm"
        >
          {CardBody}
        </Link>
      </article>
    );
  }

  return (
    <article
      onClick={onClick}
      className={`group flex flex-col bg-[var(--light)] font-jost ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {CardBody}
    </article>
  );
}

export default Card;
