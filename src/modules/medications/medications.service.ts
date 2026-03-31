import { eq, ilike, and, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { medications } from "../../db/schema/index.ts";
import { AppError } from "../../lib/AppError.ts";
import type {
	InsertMedication,
	UpdateMedication,
	MedicationQuery,
} from "./medications.validators.ts";

export async function getMedications(query: MedicationQuery) {
	console.log(query);

	const { page, limit, search, dosage_form, requires_prescription, is_active } =
		query;
	const offset = (page - 1) * limit;

	const filters: SQL[] = [];
	if (search) {
		filters.push(
			sql`(${ilike(medications.name, `%${search}%`)} OR ${ilike(medications.generic_name, `%${search}%`)})`,
		);
	}
	if (dosage_form !== undefined)
		filters.push(eq(medications.dosage_form, dosage_form));
	if (requires_prescription !== undefined)
		filters.push(eq(medications.requires_prescription, requires_prescription));
	if (is_active !== undefined)
		filters.push(eq(medications.is_active, is_active));

	const where = filters.length > 0 ? and(...filters) : undefined;

	const [rows, [{ count }]] = await Promise.all([
		db.select().from(medications).where(where).limit(limit).offset(offset),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(medications)
			.where(where),
	]);

	return {
		data: rows,
		pagination: {
			total: count,
			page,
			limit,
			pages: Math.ceil(count / limit),
		},
	};
}

export async function getMedicationById(id: string) {
	const [row] = await db
		.select()
		.from(medications)
		.where(eq(medications.id, id));
	if (!row) throw new AppError(404, `Medication not found`);
	return row;
}

export async function createMedication(data: InsertMedication) {
	const [row] = await db.insert(medications).values(data).returning();
	return row;
}

export async function updateMedication(id: string, data: UpdateMedication) {
	await getMedicationById(id);
	const [row] = await db
		.update(medications)
		.set({ ...data, updated_at: new Date() })
		.where(eq(medications.id, id))
		.returning();
	return row;
}

export async function deleteMedication(id: string) {
	await getMedicationById(id);
	const [row] = await db
		.update(medications)
		.set({ is_active: false, updated_at: new Date() })
		.where(eq(medications.id, id))
		.returning();
	return row;
}
