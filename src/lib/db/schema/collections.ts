import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "./products";

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productCollections = pgTable(
  "product_collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references((): AnyPgColumn => products.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references((): AnyPgColumn => collections.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_collections_product_collection_unique").on(
      table.productId,
      table.collectionId
    ),
    index("product_collections_collection_id_idx").on(table.collectionId),
  ]
);

export const collectionsRelations = relations(collections, ({ many }) => ({
  productCollections: many(productCollections),
}));

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id],
  }),
  collection: one(collections, {
    fields: [productCollections.collectionId],
    references: [collections.id],
  }),
}));

export const collectionInsertSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, kebab-cased."),
});

export const collectionSelectSchema = collectionInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export const productCollectionInsertSchema = z.object({
  productId: z.string().uuid(),
  collectionId: z.string().uuid(),
});

export const productCollectionSelectSchema = productCollectionInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionInput = z.infer<typeof collectionInsertSchema>;
export type ProductCollection = typeof productCollections.$inferSelect;
export type NewProductCollection = typeof productCollections.$inferInsert;
