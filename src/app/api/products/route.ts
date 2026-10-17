import { NextResponse } from "next/server";
import { asc, desc } from "drizzle-orm";
import { db, hasValidDatabaseUrl } from "@/db";
import { products } from "@/db/schema";
// import { ensureDatabaseInitialized } from "@/db/ensure-seeded";
import { BRILLIVO_SEED_PRODUCTS } from "@/db/seed-data";

export async function GET() {
  if (hasValidDatabaseUrl()) {
    try {
      let rows = await db
        .select()
        .from(products)
        .orderBy(desc(products.isFeatured), asc(products.id));

      if (rows.length === 0) {
        // await ensureDatabaseInitialized();
        rows = await db
          .select()
          .from(products)
          .orderBy(desc(products.isFeatured), asc(products.id));
      }

      return NextResponse.json({ source: "neon-postgres", products: rows });
    } catch {
      try {
        // await ensureDatabaseInitialized();
        const rows = await db
          .select()
          .from(products)
          .orderBy(desc(products.isFeatured), asc(products.id));
        return NextResponse.json({ source: "neon-postgres", products: rows });
      } catch (err) {
        console.warn("Falling back to Brillivo seed dataset:", err);
      }
    }
  }

  const fallback = BRILLIVO_SEED_PRODUCTS.map((p, idx) => ({
    ...p,
    id: idx + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return NextResponse.json({ source: "seed-fallback", products: fallback });
}
