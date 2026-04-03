import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { prescription_items, prescriptions } from "../../db/schema/index.ts";

export const insertPrescriptionItemSchema = createInsertSchema(
  prescription_items,
  {
    quantity: (s) => s.int().positive(),
    dosage_instructions: (s) => s.min(1),
    refills_allowed: (s) => s.int().min(0).default(0),
  },
).omit({ id: true, prescription_id: true, created_at: true });

export const insertPrescriptionSchema = createInsertSchema(prescriptions, {
  prescription_number: (s) => s.min(1).max(50),
  patient_name: (s) => s.min(2).max(255),
  doctor_name: (s) => s.min(2).max(255),
  doctor_license_number: (s) => s.min(1).max(100),
  issued_date: () => z.coerce.date(),
  expiry_date: () => z.coerce.date(),
  dispensed_at: () => z.coerce.date().optional(),
  patient_date_of_birth: () => z.coerce.date().optional(),
})
  .omit({ id: true, created_at: true, updated_at: true })
  .extend({
    items: z.array(insertPrescriptionItemSchema).min(1),
  });

export const updatePrescriptionSchema = createUpdateSchema(prescriptions, {
  patient_name: (s) => s.min(2).max(255),
  doctor_name: (s) => s.min(2).max(255),
  issued_date: () => z.coerce.date(),
  expiry_date: () => z.coerce.date(),
  doctor_license_number: (s) => s.min(1).max(100),
}).omit({ id: true, status: true, created_at: true, updated_at: true });

export const updatePrescriptionStatusSchema = z.object({
  status: z.enum([
    "pending",
    "verified",
    "dispensed",
    "partially_dispensed",
    "cancelled",
    "expired",
  ]),
});

export const prescriptionIdSchema = z.object({
  id: z.uuid("Invalid prescription ID"),
});

export const prescriptionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z
    .enum([
      "pending",
      "verified",
      "dispensed",
      "partially_dispensed",
      "cancelled",
      "expired",
    ])
    .optional(),
});

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type UpdatePrescription = z.infer<typeof updatePrescriptionSchema>;
export type PrescriptionQuery = z.infer<typeof prescriptionQuerySchema>;
export type UpdatePrescriptionStatus = z.infer<
  typeof updatePrescriptionStatusSchema
>;
