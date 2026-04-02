import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { medications } from "./medications.ts";
import { prescriptions } from "./prescriptions.ts";

export const userRoleEnum = pgEnum("user_role", [
  "patient",
  "doctor",
  "pharmacist",
  "admin",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  role: userRoleEnum("role").notNull().default("patient"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const user_medications = pgTable("user_medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  medication_id: uuid("medication_id")
    .notNull()
    .references(() => medications.id, { onDelete: "restrict" }),
  prescription_id: uuid("prescription_id").references(() => prescriptions.id, {
    onDelete: "set null",
  }),
  dosage_instructions: text("dosage_instructions").notNull(),
  start_date: timestamp("start_date", { withTimezone: true }).notNull(),
  end_date: timestamp("end_date", { withTimezone: true }),
  is_active: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
