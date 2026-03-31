import {
	pgTable,
	uuid,
	integer,
	varchar,
	timestamp,
	numeric,
	pgEnum,
	text,
} from "drizzle-orm/pg-core";
import { medications } from "./medications.ts";

export const transactionTypeEnum = pgEnum("transaction_type", [
	"restock",
	"prescription_dispense",
	"order_fulfillment",
	"adjustment",
	"expiry_write_off",
	"return",
]);

export const inventory = pgTable("inventory", {
	id: uuid("id").primaryKey().defaultRandom(),
	medication_id: uuid("medication_id")
		.notNull()
		.references(() => medications.id, { onDelete: "restrict" })
		.unique(),
	quantity_on_hand: integer("quantity_on_hand").notNull().default(0),
	reorder_threshold: integer("reorder_threshold").notNull().default(20),
	reorder_quantity: integer("reorder_quantity").notNull().default(100),
	unit_of_measure: varchar("unit_of_measure", { length: 50 })
		.notNull()
		.default("units"),
	updated_at: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const inventory_batches = pgTable("inventory_batches", {
	id: uuid("id").primaryKey().defaultRandom(),
	medication_id: uuid("medication_id")
		.notNull()
		.references(() => medications.id, { onDelete: "restrict" }),
	batch_number: varchar("batch_number", { length: 100 }).notNull(),
	quantity: integer("quantity").notNull(),
	quantity_remaining: integer("quantity_remaining").notNull(),
	expiry_date: timestamp("expiry_date", { withTimezone: true }).notNull(),
	manufacture_date: timestamp("manufacture_date", { withTimezone: true }),
	supplier: varchar("supplier", { length: 255 }),
	cost_per_unit: numeric("cost_per_unit", { precision: 10, scale: 2 }),
	created_at: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const stock_transactions = pgTable("stock_transactions", {
	id: uuid("id").primaryKey().defaultRandom(),
	medication_id: uuid("medication_id")
		.notNull()
		.references(() => medications.id, { onDelete: "restrict" }),
	batch_id: uuid("batch_id").references(() => inventory_batches.id, {
		onDelete: "set null",
	}),
	transaction_type: transactionTypeEnum("transaction_type").notNull(),
	quantity_delta: integer("quantity_delta").notNull(),
	quantity_before: integer("quantity_before").notNull(),
	quantity_after: integer("quantity_after").notNull(),
	reference_id: uuid("reference_id"),
	reference_type: varchar("reference_type", { length: 50 }),
	notes: text("notes"),
	created_at: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
