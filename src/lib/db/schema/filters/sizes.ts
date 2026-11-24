import { relations } from "drizzle-orm";
import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { productVariants } from "../variants";

export const sizes = pgTable("sizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const sizesRelations = relations(sizes, ({ many }) => ({
  variants: many(productVariants),
}));

export const sizeInsertSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, kebab-cased."),
  sortOrder: z.number().int().min(0).default(0),
});

export const sizeSelectSchema = sizeInsertSchema.extend({
  id: z.string().uuid(),
});

export type Size = typeof sizes.$inferSelect;
export type NewSize = typeof sizes.$inferInsert;
export type SizeInput = z.infer<typeof sizeInsertSchema>;
