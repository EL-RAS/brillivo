import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "../products";

export const genders = pgTable("genders", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  slug: text("slug").notNull().unique(),
});

export const gendersRelations = relations(genders, ({ many }) => ({
  products: many(products),
}));

const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, kebab-cased.");

export const genderInsertSchema = z.object({
  label: z.string().min(1).max(80),
  slug: slugSchema,
});

export const genderSelectSchema = genderInsertSchema.extend({
  id: z.string().uuid(),
});

export type Gender = typeof genders.$inferSelect;
export type NewGender = typeof genders.$inferInsert;
export type GenderInput = z.infer<typeof genderInsertSchema>;
