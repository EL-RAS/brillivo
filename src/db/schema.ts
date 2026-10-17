import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Brillivo Jewelry Products Table
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle").notNull(),
  collection: text("collection").notNull().default("Signature Collection"),
  category: text("category").notNull(), // 'Bracelets' | 'Rings' | 'Necklaces' | 'Earrings' | 'Brooches & Pins'
  description: text("description").notNull(),
  priceCents: integer("price_cents").notNull(),
  compareAtPriceCents: integer("compare_at_price_cents"),
  metalType: text("metal_type").notNull(),
  gemstone: text("gemstone").notNull(),
  imageUrl: text("image_url").notNull(),
  badge: text("badge"),
  inStock: boolean("in_stock").notNull().default(true),
  stockCount: integer("stock_count").notNull().default(15),
  isFeatured: boolean("is_featured").notNull().default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("4.95"),
  reviewCount: integer("review_count").notNull().default(24),
  specs: jsonb("specs").$type<{
    claspOrSetting: string;
    dimensions: string;
    engraving: string;
    stoneCut: string;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Better Auth Core Tables (User, Session, Account, Verification)
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
