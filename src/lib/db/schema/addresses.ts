import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { user } from "./user";

export const addressTypeEnum = pgEnum("address_type", ["billing", "shipping"]);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references((): AnyPgColumn => user.id, { onDelete: "cascade" }),
    type: addressTypeEnum("type").notNull().default("shipping"),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull(),
    postalCode: text("postal_code").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("addresses_user_id_idx").on(table.userId)]
);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, {
    fields: [addresses.userId],
    references: [user.id],
  }),
}));

export const addressInsertSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["billing", "shipping"]).default("shipping"),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).nullable().optional(),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(32),
  isDefault: z.boolean().default(false),
});

export const addressSelectSchema = addressInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type AddressInput = z.infer<typeof addressInsertSchema>;
