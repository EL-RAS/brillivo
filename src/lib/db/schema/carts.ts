import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { guest } from "./guest";
import { user } from "./user";
import { productVariants } from "./variants";

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references((): AnyPgColumn => user.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").references((): AnyPgColumn => guest.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("carts_user_id_idx").on(table.userId),
    index("carts_guest_id_idx").on(table.guestId),
  ]
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references((): AnyPgColumn => carts.id, { onDelete: "cascade" }),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references((): AnyPgColumn => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("cart_items_cart_id_idx").on(table.cartId),
    index("cart_items_product_variant_id_idx").on(table.productVariantId),
    uniqueIndex("cart_items_cart_variant_unique").on(table.cartId, table.productVariantId),
  ]
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(user, {
    fields: [carts.userId],
    references: [user.id],
  }),
  guest: one(guest, {
    fields: [carts.guestId],
    references: [guest.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  productVariant: one(productVariants, {
    fields: [cartItems.productVariantId],
    references: [productVariants.id],
  }),
}));

export const cartInsertSchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  guestId: z.string().uuid().nullable().optional(),
});

export const cartSelectSchema = cartInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const cartItemInsertSchema = z.object({
  cartId: z.string().uuid(),
  productVariantId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

export const cartItemSelectSchema = cartItemInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartInput = z.infer<typeof cartInsertSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type CartItemInput = z.infer<typeof cartItemInsertSchema>;
