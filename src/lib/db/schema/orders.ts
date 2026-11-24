import { relations } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { addresses } from "./addresses";
import { user } from "./user";
import { productVariants } from "./variants";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["stripe", "paypal", "cod"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "initiated",
  "completed",
  "failed",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references((): AnyPgColumn => user.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    shippingAddressId: uuid("shipping_address_id")
      .notNull()
      .references((): AnyPgColumn => addresses.id, { onDelete: "restrict" }),
    billingAddressId: uuid("billing_address_id")
      .notNull()
      .references((): AnyPgColumn => addresses.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_shipping_address_id_idx").on(table.shippingAddressId),
    index("orders_billing_address_id_idx").on(table.billingAddressId),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references((): AnyPgColumn => orders.id, { onDelete: "cascade" }),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references((): AnyPgColumn => productVariants.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    priceAtPurchase: numeric("price_at_purchase", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_product_variant_id_idx").on(table.productVariantId),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references((): AnyPgColumn => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("initiated"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    transactionId: text("transaction_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("payments_order_id_idx").on(table.orderId)]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
    relationName: "order_shipping_address",
  }),
  billingAddress: one(addresses, {
    fields: [orders.billingAddressId],
    references: [addresses.id],
    relationName: "order_billing_address",
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  productVariant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

const moneySchema = z
  .string()
  .regex(/^\d{1,10}(?:\.\d{1,2})?$/, "Amount must be a decimal with up to 2 places.");

export const orderInsertSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]).default("pending"),
  totalAmount: moneySchema,
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid(),
});

export const orderSelectSchema = orderInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const orderItemInsertSchema = z.object({
  orderId: z.string().uuid(),
  productVariantId: z.string().uuid(),
  quantity: z.number().int().min(1),
  priceAtPurchase: moneySchema,
});

export const orderItemSelectSchema = orderItemInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export const paymentInsertSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(["stripe", "paypal", "cod"]),
  status: z.enum(["initiated", "completed", "failed"]).default("initiated"),
  paidAt: z.date().nullable().optional(),
  transactionId: z.string().max(255).nullable().optional(),
});

export const paymentSelectSchema = paymentInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderInput = z.infer<typeof orderInsertSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderItemInput = z.infer<typeof orderItemInsertSchema>;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentInput = z.infer<typeof paymentInsertSchema>;
