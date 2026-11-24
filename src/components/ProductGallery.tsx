"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

/**
 * Client-side product gallery.
 *
 * Owns the "finish / plating" swatch selection and the active image index.
 * All image rendering flows through `validImages`, which drops empty or
 * obviously invalid sources so the gallery can never show a broken frame.
 */

export type GallerySwatch = {
  /** Stable identifier, usually the colour/plating slug. */
  id: string;
  label: string;
  hexCode: string;
  images: string[];
};

export interface ProductGalleryProps {
  /** Fallback images shown when the product has no per-finish images. */
  images: string[];
  /** Optional finish swatches; when omitted the swatch row is not rendered. */
  swatches?: GallerySwatch[];
  productName: string;
}

function isValidSrc(src: string | undefined | null): src is string {
  return typeof src === "string" && src.trim().length > 0;
}

export default function ProductGallery({
  images,
  swatches = [],
  productName,
}: ProductGalleryProps) {
  const usableSwatches = useMemo(
    () => swatches.filter((swatch) => Array.isArray(swatch.images) && swatch.images.some(isValidSrc)),
    [swatches]
  );

  const [activeSwatchId, setActiveSwatchId] = useState<string | undefined>(
    usableSwatches[0]?.id
  );

  const validImages = useMemo(() => {
    const activeSwatch = usableSwatches.find((swatch) => swatch.id === activeSwatchId);
    const source = activeSwatch ? activeSwatch.images : images;
    return (source ?? []).filter(isValidSrc);
  }, [usableSwatches, activeSwatchId, images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);

  // Reset to the first image whenever the selected finish changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [activeSwatchId]);

  const focusFrame = useCallback(() => frameRef.current?.focus(), []);

  const step = useCallback(
    (direction: -1 | 1) => {
      if (validImages.length === 0) return;
      setActiveIndex((index) => (index + direction + validImages.length) % validImages.length);
    },
    [validImages.length]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    },
    [step]
  );

  const activeImage = validImages[activeIndex];

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Thumbnail strip — horizontal on mobile, vertical on desktop. */}
        {validImages.length > 1 && (
          <div
            className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:max-h-[560px] lg:flex-col lg:overflow-y-auto lg:pb-0"
            role="tablist"
            aria-label={`${productName} images`}
          >
            {validImages.map((src, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`View image ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 lg:h-20 lg:w-20 ${
                    isActive
                      ? "ring-2 ring-dark-900"
                      : "ring-1 ring-light-300 hover:ring-silver-400"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Main image frame. */}
        <div
          ref={frameRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          role="group"
          aria-label="Product image viewer. Use the left and right arrow keys to change images."
          className="order-1 relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-light-200 outline-none focus-visible:ring-2 focus-visible:ring-silver-500 lg:order-2"
        >
          {activeImage ? (
            <Image
              src={activeImage}
              alt={productName}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-silver-600">
              <ImageOff className="h-8 w-8" aria-hidden="true" />
              <span className="text-caption">Image coming soon</span>
            </div>
          )}

          {validImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => {
                  step(-1);
                  focusFrame();
                }}
                className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-light-100/85 text-dark-900 ring-1 ring-light-300 backdrop-blur transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => {
                  step(1);
                  focusFrame();
                }}
                className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-light-100/85 text-dark-900 ring-1 ring-light-300 backdrop-blur transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Finish / plating swatches. */}
      {usableSwatches.length > 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-caption uppercase tracking-[0.28em] text-silver-600">
            Finish / Plating
          </p>
          <div className="flex flex-wrap gap-3">
            {usableSwatches.map((swatch) => {
              const isActive = swatch.id === activeSwatchId;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => setActiveSwatchId(swatch.id)}
                  aria-pressed={isActive}
                  className={`group inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 ${
                    isActive
                      ? "border-dark-900 bg-light-100"
                      : "border-light-300 hover:border-silver-400"
                  }`}
                >
                  <span
                    className="relative inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: swatch.hexCode }}
                    aria-hidden="true"
                  >
                    {isActive && <Check className="h-4 w-4 text-dark-900 drop-shadow" />}
                  </span>
                  <span className="text-caption text-dark-900">{swatch.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
