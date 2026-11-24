import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { guest } from "./guest";
import { products } from "./products";
import { user } from "./user";

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references((): AnyPgColumn => user.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").references((): AnyPgColumn => guest.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references((): AnyPgColumn => products.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("wishlists_user_id_idx").on(table.userId),
    index("wishlists_guest_id_idx").on(table.guestId),
    index("wishlists_product_id_idx").on(table.productId),
    uniqueIndex("wishlists_user_product_unique").on(table.userId, table.productId),
    uniqueIndex("wishlists_guest_product_unique").on(table.guestId, table.productId),
  ]
);

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(user, {
    fields: [wishlists.userId],
    references: [user.id],
  }),
  guest: one(guest, {
    fields: [wishlists.guestId],
    references: [guest.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export const wishlistInsertSchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  guestId: z.string().uuid().nullable().optional(),
  productId: z.string().uuid(),
});

export const wishlistSelectSchema = wishlistInsertSchema.extend({
  id: z.string().uuid(),
  addedAt: z.date(),
});

export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type WishlistInput = z.infer<typeof wishlistInsertSchema>;
