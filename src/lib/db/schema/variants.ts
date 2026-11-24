import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { colors } from "./filters/colors";
import { sizes } from "./filters/sizes";
import { productImages, products } from "./products";

export type Dimensions = {
  length: number;
  width: number;
  height: number;
};

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references((): AnyPgColumn => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
    colorId: uuid("color_id")
      .notNull()
      .references((): AnyPgColumn => colors.id, { onDelete: "restrict" }),
    sizeId: uuid("size_id")
      .notNull()
      .references((): AnyPgColumn => sizes.id, { onDelete: "restrict" }),
    inStock: integer("in_stock").notNull().default(0),
    weight: doublePrecision("weight").notNull(),
    dimensions: jsonb("dimensions").$type<Dimensions>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_variants_product_id_idx").on(table.productId),
    index("product_variants_color_id_idx").on(table.colorId),
    index("product_variants_size_id_idx").on(table.sizeId),
    index("product_variants_color_product_idx").on(table.colorId, table.productId),
  ]
);

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
    relationName: "product_variants",
  }),
  color: one(colors, {
    fields: [productVariants.colorId],
    references: [colors.id],
  }),
  size: one(sizes, {
    fields: [productVariants.sizeId],
    references: [sizes.id],
  }),
  images: many(productImages),
}));

const moneySchema = z
  .string()
  .regex(/^\d{1,10}(?:\.\d{1,2})?$/, "Amount must be a decimal with up to 2 places.");

export const dimensionsSchema = z.object({
  length: z.number().nonnegative(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
});

export const variantInsertSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(120),
  price: moneySchema,
  salePrice: moneySchema.nullable().optional(),
  colorId: z.string().uuid(),
  sizeId: z.string().uuid(),
  inStock: z.number().int().min(0).default(0),
  weight: z.number().nonnegative(),
  dimensions: dimensionsSchema.nullable().optional(),
});

export const variantSelectSchema = variantInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export { moneySchema };

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type VariantInput = z.infer<typeof variantInsertSchema>;
