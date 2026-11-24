"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Eye, Heart, Loader2, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";

import WishlistHeart from "./WishlistHeart";
import { useCartStore } from "@/store/cart.store";

export type BadgeTone = "red" | "green" | "orange" | "dark";

interface CardBaseProps {
  title: string;
  description?: string;
  subtitle?: string;
  category?: string;
  meta?: string | string[];
  imageAlt?: string;
  price?: string | number;
  originalPrice?: string | number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  href?: string;
  badge?: { label: string; tone?: BadgeTone };
  /**
   * Default variant to add when the card's "Add to cart" button is pressed.
   * When omitted the button falls back to the `onAddToCart` callback (or is
   * hidden if neither is provided).
   */
  defaultVariantId?: string | null;
  /**
   * Product id used to toggle the wishlist from the heart overlay. When
   * omitted, the heart falls back to the `onToggleWishlist` callback.
   */
  wishlistProductId?: string;
  onAddToCart?: () => void;
  onQuickView?: () => void;
  onToggleWishlist?: (active: boolean) => void;
  className?: string;
}

export type CardProps = CardBaseProps &
  ({ imageSrc: string; image?: never } | { image: string; imageSrc?: never });

const IMAGE_SIZES =
  "(min-width: 1280px) 360px, (min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw";

const BADGE_TONE: Record<BadgeTone, string> = {
  red: "text-[--color-red]",
  green: "text-[--color-green]",
  orange: "text-[--color-orange]",
  dark: "text-dark-900",
};

const ACTION_BUTTON =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full text-caption uppercase tracking-[0.18em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2";

function formatPrice(value?: string | number): string | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === "number" ? `$${value.toFixed(2)}` : value;
}

function Rating({ value, count }: { value: number; count?: number }) {
  const stars = Math.round(Math.min(5, Math.max(0, value)));
  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`Rated ${value} out of 5${count !== undefined ? ` from ${count} reviews` : ""}`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${
              index < stars ? "fill-silver-600 text-silver-600" : "text-silver-300"
            }`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-footnote text-silver-600">({count})</span>
      )}
    </div>
  );
}

export default function Card({
  title,
  description,
  subtitle,
  category,
  meta,
  imageSrc,
  image,
  imageAlt,
  price,
  originalPrice,
  discount,
  rating,
  reviewCount,
  href,
  badge,
  defaultVariantId,
  wishlistProductId,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  className = "",
}: CardProps) {
  const src = imageSrc ?? image;
  const [wished, setWished] = useState(false);
  const [addStatus, setAddStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const addItem = useCartStore((state) => state.addItem);
  const displayPrice = formatPrice(price);
  const displayOriginalPrice = formatPrice(originalPrice);
  const discountLabel =
    typeof discount === "number" && discount > 0 ? `${Math.round(discount)}% off` : undefined;
  const metaText = meta ? (Array.isArray(meta) ? meta.join(" • ") : meta) : undefined;

  const canAddToCart = Boolean(defaultVariantId) || Boolean(onAddToCart);

  const handleAddToCart = async () => {
    if (defaultVariantId) {
      setAddStatus("adding");
      const ok = await addItem(defaultVariantId, 1);
      setAddStatus(ok ? "added" : "error");
      if (ok) {
        window.setTimeout(() => setAddStatus("idle"), 2000);
      }
      return;
    }

    onAddToCart?.();
  };

  const media = (
    <div className="relative aspect-[4/5] overflow-hidden bg-light-200">
      {href ? (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 block focus:outline-none"
        >
          <Image
            src={src}
            alt=""
            fill
            sizes={IMAGE_SIZES}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>
      ) : (
        <Image
          src={src}
          alt={imageAlt ?? title}
          fill
          sizes={IMAGE_SIZES}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark-900/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {(badge || discountLabel) && (
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          {badge && (
            <span
              className={`rounded-full border border-light-300/80 bg-light-100/85 px-2.5 py-1 text-footnote uppercase tracking-[0.18em] backdrop-blur ${BADGE_TONE[badge.tone ?? "dark"]}`}
            >
              {badge.label}
            </span>
          )}
          {discountLabel && (
            <span className="rounded-full bg-dark-900 px-2.5 py-1 text-footnote uppercase tracking-[0.18em] text-light-100">
              {discountLabel}
            </span>
          )}
        </div>
      )}

      {wishlistProductId ? (
        <WishlistHeart productId={wishlistProductId} productName={title} variant="overlay" />
      ) : (
        <button
          type="button"
          aria-label={`Add ${title} to wishlist`}
          aria-pressed={wished}
          onClick={() => {
            const next = !wished;
            setWished(next);
            onToggleWishlist?.(next);
          }}
          className={`absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] ${
            wished
              ? "border-dark-900 bg-dark-900 text-light-100"
              : "border-light-300/70 bg-light-100/85 text-dark-900 hover:bg-light-100"
          }`}
        >
          <Heart aria-hidden="true" className={`h-4 w-4 ${wished ? "fill-light-100" : ""}`} />
        </button>
      )}

      <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2 transition-all duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
        {canAddToCart && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addStatus === "adding"}
            aria-label={`Add ${title} to cart`}
            className={`${ACTION_BUTTON} flex-1 bg-dark-900 text-light-100 hover:bg-silver-700 disabled:cursor-not-allowed disabled:opacity-80`}
          >
            {addStatus === "added" ? (
              <>
                <Check aria-hidden="true" className="h-4 w-4" />
                Added
              </>
            ) : addStatus === "error" ? (
              <>
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                Try again
              </>
            ) : addStatus === "adding" ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Adding
              </>
            ) : (
              <>
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                Add to cart
              </>
            )}
          </button>
        )}
        <button
          type="button"
          aria-label={`Quick view ${title}`}
          onClick={onQuickView}
          className={`${ACTION_BUTTON} w-10 shrink-0 bg-light-100/90 text-dark-900 backdrop-blur hover:bg-light-100`}
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-silver-200 bg-light-100 transition-all duration-300 hover:border-silver-400 hover:shadow-[0_24px_60px_-32px_rgba(17,17,17,0.45)] ${className}`}
    >
      {media}

      <div className="flex flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {(category || subtitle) && (
              <p className="mb-1 text-footnote uppercase tracking-[0.28em] text-silver-600">
                {category ?? subtitle}
              </p>
            )}
            {href ? (
              <Link
                href={href}
                className="text-heading-3 text-dark-900 transition-colors hover:text-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500]"
              >
                {title}
              </Link>
            ) : (
              <h3 className="text-heading-3 text-dark-900">{title}</h3>
            )}
          </div>

          {displayPrice && (
            <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
              {displayOriginalPrice && (
                <span className="text-caption text-dark-700 line-through">
                  {displayOriginalPrice}
                </span>
              )}
              <span className="text-body-medium text-dark-900">{displayPrice}</span>
            </span>
          )}
        </div>

        {rating !== undefined && <Rating value={rating} count={reviewCount} />}

        {(description || metaText) && (
          <p className="text-caption text-dark-700">{description ?? metaText}</p>
        )}
      </div>
    </article>
  );
}
