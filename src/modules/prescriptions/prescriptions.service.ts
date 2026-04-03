import { and, eq, ilike, type SQL, sql } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { prescription_items, prescriptions } from "../../db/schema/index.ts";
import { AppError } from "../../lib/AppError.ts";
import type {
  InsertPrescription,
  PrescriptionQuery,
  UpdatePrescription,
  UpdatePrescriptionStatus,
} from "./prescriptions.validators.ts";

export async function getPrescriptions(query: PrescriptionQuery) {
  const { page, limit, search, status } = query;
  const offset = (page - 1) * limit;

  const filters: SQL[] = [];
  if (search) {
    filters.push(
      sql`(${ilike(prescriptions.patient_name, `%${search}%`)} OR ${ilike(prescriptions.doctor_name, `%${search}%`)} OR ${ilike(prescriptions.prescription_number, `%${search}%`)})`,
    );
  }
  if (status !== undefined) filters.push(eq(prescriptions.status, status));

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(prescriptions).where(where).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(prescriptions)
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

export async function getPrescriptionById(id: string) {
  const [row] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, id));
  if (!row) throw new AppError(404, "Prescription not found");

  const items = await db
    .select()
    .from(prescription_items)
    .where(eq(prescription_items.prescription_id, id));

  return { ...row, items };
}

export async function createPrescription(data: InsertPrescription) {
  const { items, ...prescriptionData } = data;

  return await db.transaction(async (tx) => {
    const [prescription] = await tx
      .insert(prescriptions)
      .values(prescriptionData)
      .returning();

    const insertedItems = await tx
      .insert(prescription_items)
      .values(
        items.map((item) => ({ ...item, prescription_id: prescription.id })),
      )
      .returning();

    return { ...prescription, items: insertedItems };
  });
}

export async function updatePrescription(id: string, data: UpdatePrescription) {
  const [row] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, id));
  if (!row) throw new AppError(404, "Prescription not found");

  const [updated] = await db
    .update(prescriptions)
    .set({ ...data, updated_at: new Date() })
    .where(eq(prescriptions.id, id))
    .returning();

  return updated;
}

export async function updatePrescriptionStatus(
  id: string,
  data: UpdatePrescriptionStatus,
) {
  const [row] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, id));
  if (!row) throw new AppError(404, "Prescription not found");

  const patch: Partial<typeof row> & { updated_at: Date } = {
    status: data.status,
    updated_at: new Date(),
  };
  if (data.status === "dispensed") patch.dispensed_at = new Date();

  const [updated] = await db
    .update(prescriptions)
    .set(patch)
    .where(eq(prescriptions.id, id))
    .returning();

  return updated;
}

export async function deletePrescription(id: string) {
  const [row] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, id));
  if (!row) throw new AppError(404, "Prescription not found");

  const [updated] = await db
    .update(prescriptions)
    .set({ status: "cancelled", updated_at: new Date() })
    .where(eq(prescriptions.id, id))
    .returning();

  return updated;
}
