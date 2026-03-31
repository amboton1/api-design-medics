import {
	createInsertSchema,
	createUpdateSchema,
	createSelectSchema,
} from "drizzle-zod";
import { z } from "zod";
import { medications } from "../../db/schema/index.ts";

export const selectMedicationSchema = createSelectSchema(medications);

export const insertMedicationSchema = createInsertSchema(medications, {
	name: (s) => s.min(2).max(255),
	strength: (s) => s.min(1).max(100),
	unit_price: (s) =>
		s.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price (e.g. 1.25)"),
}).omit({ id: true, created_at: true, updated_at: true });

export const updateMedicationSchema = createUpdateSchema(medications, {
	name: (s) => s.min(2).max(255),
	strength: (s) => s.min(1).max(100),
	unit_price: (s) =>
		s.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price (e.g. 1.25)"),
}).omit({ id: true, created_at: true, updated_at: true });

export const medicationIdSchema = z.object({
	id: z.string().uuid("Invalid medication ID"),
});

export const medicationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	dosage_form: z
		.enum([
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
		])
		.optional(),
	requires_prescription: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
	is_active: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type UpdateMedication = z.infer<typeof updateMedicationSchema>;
export type MedicationQuery = z.infer<typeof medicationQuerySchema>;
