import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const dosageFormEnum = pgEnum("dosage_form", [
  "tablet",
  "capsule",
  "liquid",
  "injection",
  "cream",
  "inhaler",
  "patch",
  "suppository",
  "drops",
  "other",
]);

export const medications = pgTable("medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  generic_name: varchar("generic_name", { length: 255 }),
  dosage_form: dosageFormEnum("dosage_form").notNull(),
  strength: varchar("strength", { length: 100 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }).notNull(),
  requires_prescription: boolean("requires_prescription")
    .notNull()
    .default(false),
  description: text("description"),
  active_ingredient: varchar("active_ingredient", { length: 255 }),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
