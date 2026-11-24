import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { productVariants } from "../variants";

export const colors = pgTable("colors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  hexCode: text("hex_code").notNull(),
});

export const colorsRelations = relations(colors, ({ many }) => ({
  variants: many(productVariants),
}));

export const colorInsertSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, kebab-cased."),
  hexCode: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Hex code must be a valid color (e.g. #C0C0C0)."),
});

export const colorSelectSchema = colorInsertSchema.extend({
  id: z.string().uuid(),
});

export type Color = typeof colors.$inferSelect;
export type NewColor = typeof colors.$inferInsert;
export type ColorInput = z.infer<typeof colorInsertSchema>;
