import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const guest = pgTable(
  "guest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionToken: text("session_token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("guest_expires_at_idx").on(table.expiresAt)]
);

export type Guest = typeof guest.$inferSelect;
export type NewGuest = typeof guest.$inferInsert;
