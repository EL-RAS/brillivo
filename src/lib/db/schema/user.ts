import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { account } from "./account";
import { addresses } from "./addresses";
import { carts } from "./carts";
import { orders } from "./orders";
import { reviews } from "./reviews";
import { session } from "./session";
import { wishlists } from "./wishlists";

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  wishlists: many(wishlists),
  carts: many(carts),
}));

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
