import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function hasValidDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      url.startsWith("postgres") &&
      !url.includes("ep-placeholder") &&
      !url.includes("user:password@")
  );
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://user:password@ep-placeholder.us-east-2.aws.neon.tech/brillivo?sslmode=require";

export const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
