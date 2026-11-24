import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "./products";
import { user } from "./user";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references((): AnyPgColumn => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references((): AnyPgColumn => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reviews_product_id_idx").on(table.productId),
    index("reviews_user_id_idx").on(table.userId),
    uniqueIndex("reviews_product_user_unique").on(table.productId, table.userId),
    check("reviews_rating_check", sql`${table.rating} between 1 and 5`),
  ]
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [reviews.userId],
    references: [user.id],
  }),
}));

export const reviewInsertSchema = z.object({
  productId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullable().optional(),
});

export const reviewSelectSchema = reviewInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ReviewInput = z.infer<typeof reviewInsertSchema>;
