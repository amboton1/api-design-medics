import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { medications } from "./medications.ts";

export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "pending",
  "verified",
  "dispensed",
  "partially_dispensed",
  "cancelled",
  "expired",
]);

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescription_number: varchar("prescription_number", { length: 50 })
    .notNull()
    .unique(),

  patient_name: varchar("patient_name", { length: 255 }).notNull(),
  patient_date_of_birth: timestamp("patient_date_of_birth", {
    withTimezone: true,
  }),
  patient_contact: varchar("patient_contact", { length: 100 }),
  patient_address: text("patient_address"),

  doctor_name: varchar("doctor_name", { length: 255 }).notNull(),
  doctor_license_number: varchar("doctor_license_number", {
    length: 100,
  }).notNull(),
  doctor_contact: varchar("doctor_contact", { length: 100 }),
  doctor_specialization: varchar("doctor_specialization", { length: 100 }),

  status: prescriptionStatusEnum("status").notNull().default("pending"),
  issued_date: timestamp("issued_date", { withTimezone: true }).notNull(),
  expiry_date: timestamp("expiry_date", { withTimezone: true }).notNull(),
  dispensed_at: timestamp("dispensed_at", { withTimezone: true }),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const prescription_items = pgTable("prescription_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescription_id: uuid("prescription_id")
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }),
  medication_id: uuid("medication_id")
    .notNull()
    .references(() => medications.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  dosage_instructions: text("dosage_instructions").notNull(),
  refills_allowed: integer("refills_allowed").notNull().default(0),
  refills_used: integer("refills_used").notNull().default(0),
  substitution_allowed: varchar("substitution_allowed", { length: 10 })
    .notNull()
    .default("no"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
