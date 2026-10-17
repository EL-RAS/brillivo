import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export function hasValidDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.startsWith("postgres"));
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL environment variable is not configured.");
}

const pool = new Pool({
  connectionString: connectionString ?? "",
});

export const db = drizzle(pool, { schema });

export * from "./schema";
