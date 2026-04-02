import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { medications } from "./medications.ts";

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "submitted",
  "confirmed",
  "processing",
  "fulfilled",
  "partially_fulfilled",
  "cancelled",
]);

export const pharmacies = pgTable("pharmacies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  license_number: varchar("license_number", { length: 100 }).notNull().unique(),
  address: text("address").notNull(),
  contact_phone: varchar("contact_phone", { length: 50 }),
  contact_email: varchar("contact_email", { length: 255 }),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_number: varchar("order_number", { length: 50 }).notNull().unique(),
  pharmacy_id: uuid("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").notNull().default("draft"),
  total_amount: numeric("total_amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  fulfilled_at: timestamp("fulfilled_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const order_items = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  medication_id: uuid("medication_id")
    .notNull()
    .references(() => medications.id, { onDelete: "restrict" }),
  quantity_ordered: integer("quantity_ordered").notNull(),
  quantity_fulfilled: integer("quantity_fulfilled").notNull().default(0),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  line_total: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
