import { eq, and, lte, sql, lt, type SQL } from "drizzle-orm";
import { db } from "../../db/index.ts";
import {
	inventory,
	inventory_batches,
	stock_transactions,
	medications,
} from "../../db/schema/index.ts";
import { AppError } from "../../lib/AppError.ts";
import type {
	InsertInventory,
	UpdateInventory,
	InsertBatch,
	InsertTransaction,
	InventoryQuery,
	BatchQuery,
	TransactionQuery,
} from "./inventory.validators.ts";

export async function getInventory(query: InventoryQuery) {
	const { page, limit, low_stock } = query;
	const offset = (page - 1) * limit;

	const filters: SQL[] = [];
	if (low_stock) {
		filters.push(lte(inventory.quantity_on_hand, inventory.reorder_threshold));
	}

	const where = filters.length > 0 ? and(...filters) : undefined;

	const [rows, [{ count }]] = await Promise.all([
		db
			.select({
				id: inventory.id,
				medication_id: inventory.medication_id,
				medication_name: medications.name,
				quantity_on_hand: inventory.quantity_on_hand,
				reorder_threshold: inventory.reorder_threshold,
				reorder_quantity: inventory.reorder_quantity,
				unit_of_measure: inventory.unit_of_measure,
				updated_at: inventory.updated_at,
			})
			.from(inventory)
			.innerJoin(medications, eq(inventory.medication_id, medications.id))
			.where(where)
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(inventory)
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

export async function getInventoryByMedicationId(medicationId: string) {
	const [row] = await db
		.select()
		.from(inventory)
		.where(eq(inventory.medication_id, medicationId));
	if (!row) throw new AppError(404, "Inventory record not found");
	return row;
}

export async function createInventory(data: InsertInventory) {
	const [row] = await db.insert(inventory).values(data).returning();
	return row;
}

export async function updateInventory(
	medicationId: string,
	data: UpdateInventory,
) {
	await getInventoryByMedicationId(medicationId);
	const [row] = await db
		.update(inventory)
		.set({ ...data, updated_at: new Date() })
		.where(eq(inventory.medication_id, medicationId))
		.returning();
	return row;
}

export async function getBatches(medicationId: string, query: BatchQuery) {
	const { page, limit, expired } = query;
	const offset = (page - 1) * limit;

	const filters: SQL[] = [eq(inventory_batches.medication_id, medicationId)];
	if (expired === true) {
		filters.push(lt(inventory_batches.expiry_date, new Date()));
	} else if (expired === false) {
		filters.push(sql`${inventory_batches.expiry_date} >= now()`);
	}

	const where = and(...filters);

	const [rows, [{ count }]] = await Promise.all([
		db
			.select()
			.from(inventory_batches)
			.where(where)
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(inventory_batches)
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

export async function getBatchById(batchId: string) {
	const [row] = await db
		.select()
		.from(inventory_batches)
		.where(eq(inventory_batches.id, batchId));
	if (!row) throw new AppError(404, "Batch not found");
	return row;
}

export async function createBatch(medicationId: string, data: InsertBatch) {
	const inventoryRow = await getInventoryByMedicationId(medicationId);

	return await db.transaction(async (tx) => {
		const [batch] = await tx
			.insert(inventory_batches)
			.values({ ...data, medication_id: medicationId })
			.returning();

		await tx
			.update(inventory)
			.set({
				quantity_on_hand:
					inventoryRow.quantity_on_hand + data.quantity_remaining,
				updated_at: new Date(),
			})
			.where(eq(inventory.medication_id, medicationId));

		return batch;
	});
}

export async function getTransactions(
	medicationId: string,
	query: TransactionQuery,
) {
	const { page, limit, transaction_type } = query;
	const offset = (page - 1) * limit;

	const filters: SQL[] = [eq(stock_transactions.medication_id, medicationId)];
	if (transaction_type !== undefined) {
		filters.push(eq(stock_transactions.transaction_type, transaction_type));
	}

	const where = and(...filters);

	const [rows, [{ count }]] = await Promise.all([
		db
			.select()
			.from(stock_transactions)
			.where(where)
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(stock_transactions)
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

export async function createTransaction(
	medicationId: string,
	data: InsertTransaction,
) {
	const inventoryRow = await getInventoryByMedicationId(medicationId);

	const quantity_before = inventoryRow.quantity_on_hand;
	const quantity_after = quantity_before + data.quantity_delta;

	if (quantity_after < 0) {
		throw new AppError(400, "Insufficient stock");
	}

	return await db.transaction(async (tx) => {
		const [transaction] = await tx
			.insert(stock_transactions)
			.values({
				...data,
				medication_id: medicationId,
				quantity_before,
				quantity_after,
			})
			.returning();

		await tx
			.update(inventory)
			.set({ quantity_on_hand: quantity_after, updated_at: new Date() })
			.where(eq(inventory.medication_id, medicationId));

		return transaction;
	});
}
