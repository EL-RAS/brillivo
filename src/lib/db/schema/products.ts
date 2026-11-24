import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { categories } from "./categories";
import { productCollections } from "./collections";
import { genders } from "./filters/genders";
import { reviews } from "./reviews";
import { productVariants } from "./variants";
import { wishlists } from "./wishlists";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: uuid("category_id")
      .notNull()
      .references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
    genderId: uuid("gender_id")
      .notNull()
      .references((): AnyPgColumn => genders.id, { onDelete: "restrict" }),
    isPublished: boolean("is_published").notNull().default(false),
    defaultVariantId: uuid("default_variant_id").references(
      (): AnyPgColumn => productVariants.id,
      {
        onDelete: "set null",
      }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("products_category_id_idx").on(table.categoryId),
    index("products_gender_id_idx").on(table.genderId),
    index("products_default_variant_id_idx").on(table.defaultVariantId),
    index("products_category_published_idx").on(table.categoryId, table.isPublished),
    index("products_gender_published_idx").on(table.genderId, table.isPublished),
  ]
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references((): AnyPgColumn => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references((): AnyPgColumn => productVariants.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_images_product_id_idx").on(table.productId),
    index("product_images_variant_id_idx").on(table.variantId),
  ]
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  gender: one(genders, {
    fields: [products.genderId],
    references: [genders.id],
  }),
  defaultVariant: one(productVariants, {
    fields: [products.defaultVariantId],
    references: [productVariants.id],
    relationName: "product_default_variant",
  }),
  variants: many(productVariants, { relationName: "product_variants" }),
  images: many(productImages),
  reviews: many(reviews),
  productCollections: many(productCollections),
  wishlists: many(wishlists),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, kebab-cased.");

export const productInsertSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(5000).nullable().optional(),
  categoryId: z.string().uuid(),
  genderId: z.string().uuid(),
  isPublished: z.boolean().default(false),
  defaultVariantId: z.string().uuid().nullable().optional(),
});

export const productSelectSchema = productInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const productImageInsertSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  url: z.string().min(1).max(2048),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const productImageSelectSchema = productImageInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export { slugSchema };

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductInput = z.infer<typeof productInsertSchema>;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type ProductImageInput = z.infer<typeof productImageInsertSchema>;
