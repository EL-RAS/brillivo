import { index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxUsage: integer("max_usage"),
    usedCount: integer("used_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("coupons_expires_at_idx").on(table.expiresAt)]
);

const moneySchema = z
  .string()
  .regex(/^\d{1,10}(?:\.\d{1,2})?$/, "Amount must be a decimal with up to 2 places.");

export const couponInsertSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[A-Z0-9-]+$/, "Coupon code must be uppercase alphanumeric (dashes allowed)."),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: moneySchema,
  expiresAt: z.date().nullable().optional(),
  maxUsage: z.number().int().min(0).nullable().optional(),
  usedCount: z.number().int().min(0).default(0),
});

export const couponSelectSchema = couponInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type CouponInput = z.infer<typeof couponInsertSchema>;
