import React from "react";
import { asc, desc } from "drizzle-orm";
import { db, hasValidDatabaseUrl } from "@/db";
import { products, type Product } from "@/db/schema";
import { BRILLIVO_SEED_PRODUCTS } from "@/db/seed-data";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  if (hasValidDatabaseUrl()) {
    try {
      const rows = await db
        .select()
        .from(products)
        .orderBy(desc(products.isFeatured), asc(products.id));
      if (rows.length > 0) return rows;
    } catch (error) {
      console.warn("Drizzle fallback to Brillivo seed products:", error);
    }
  }

  return BRILLIVO_SEED_PRODUCTS.map((item, idx) => ({
    id: idx + 1,
    sku: item.sku,
    name: item.name,
    slug: item.slug,
    subtitle: item.subtitle,
    collection: item.collection ?? "Signature Collection",
    category: item.category,
    description: item.description,
    priceCents: item.priceCents,
    compareAtPriceCents: item.compareAtPriceCents ?? null,
    metalType: item.metalType,
    gemstone: item.gemstone,
    imageUrl: item.imageUrl,
    badge: item.badge ?? null,
    inStock: item.inStock ?? true,
    stockCount: item.stockCount ?? 15,
    isFeatured: item.isFeatured ?? true,
    rating: item.rating ?? "4.95",
    reviewCount: item.reviewCount ?? 24,
    specs: item.specs,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export default async function HomePage() {
  const catalog = await getProducts();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--light)] text-[var(--dark)] font-jost">

      <main className="flex-1">

        {/* 2. Best of Signature Collection — Rendered via Reusable <Card /> Component */}
        <section
          id="collections"
          aria-labelledby="best-of-brillivo-heading"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex items-end justify-between">
            <h2
              id="best-of-brillivo-heading"
              className="text-heading-3 font-medium text-[var(--dark)]"
            >
              Best of Signature Collection
            </h2>
            <span className="text-caption text-[var(--dark)]/60">
              {catalog.length} Hallmarked Pieces
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((item, idx) => (
              <Card
                key={item.id}
                id={item.id}
                title={item.name}
                description={item.subtitle}
                category={item.category}
                imageSrc={item.imageUrl}
                imageAlt={item.name}
                price={item.priceCents / 100}
                compareAtPrice={
                  item.compareAtPriceCents ? item.compareAtPriceCents / 100 : null
                }
                badge={item.badge}
                badgeTone={idx === 0 ? "agua" : "dark"}
                meta={`${item.metalType.split("&")[0].trim()} • ${item.gemstone}`}
                href={`#${item.slug}`}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
