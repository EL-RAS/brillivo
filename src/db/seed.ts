import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { ensureDatabaseInitialized } from "./ensure-seeded";
import { BRILLIVO_SEED_PRODUCTS } from "./seed-data";

async function seed() {
  console.log("✨ Creating tables (if needed) and seeding Brillivo Signature Collection into Neon PostgreSQL...");

  try {
    await ensureDatabaseInitialized();
    for (const item of BRILLIVO_SEED_PRODUCTS) {
      console.log(`  ✓ Upserted [${item.sku}] ${item.name}`);
    }
    console.log(`\n🎉 Successfully initialized schema and seeded ${BRILLIVO_SEED_PRODUCTS.length} Brillivo products!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  }
}

seed();
