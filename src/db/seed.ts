import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import env from "../../env.ts";
import * as schema from "./schema/index.ts";

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
	console.log("🌱 Seeding database...");

	console.log("  → clearing existing data");
	await db.delete(schema.user_medications);
	await db.delete(schema.users);
	await db.delete(schema.prescription_items);
	await db.delete(schema.prescriptions);
	await db.delete(schema.order_items);
	await db.delete(schema.orders);
	await db.delete(schema.pharmacies);
	await db.delete(schema.stock_transactions);
	await db.delete(schema.inventory_batches);
	await db.delete(schema.inventory);
	await db.delete(schema.medications);

	console.log("  → medications");
	const [med1, med2, med3, med4, med5] = await db
		.insert(schema.medications)
		.values([
			{
				name: "Amoxicillin",
				generic_name: "Amoxicillin trihydrate",
				dosage_form: "capsule",
				strength: "500mg",
				manufacturer: "GlaxoSmithKline",
				requires_prescription: true,
				description: "Broad-spectrum penicillin antibiotic",
				active_ingredient: "Amoxicillin",
				unit_price: "1.25",
				is_active: true,
			},
			{
				name: "Ibuprofen",
				generic_name: "Ibuprofen",
				dosage_form: "tablet",
				strength: "400mg",
				manufacturer: "Pfizer",
				requires_prescription: false,
				description: "Non-steroidal anti-inflammatory drug (NSAID)",
				active_ingredient: "Ibuprofen",
				unit_price: "0.45",
				is_active: true,
			},
			{
				name: "Metformin",
				generic_name: "Metformin hydrochloride",
				dosage_form: "tablet",
				strength: "850mg",
				manufacturer: "Merck",
				requires_prescription: true,
				description: "First-line medication for type 2 diabetes",
				active_ingredient: "Metformin",
				unit_price: "0.30",
				is_active: true,
			},
			{
				name: "Salbutamol",
				generic_name: "Albuterol",
				dosage_form: "inhaler",
				strength: "100mcg",
				manufacturer: "AstraZeneca",
				requires_prescription: true,
				description: "Bronchodilator for asthma and COPD",
				active_ingredient: "Salbutamol sulfate",
				unit_price: "8.50",
				is_active: true,
			},
			{
				name: "Cetirizine",
				generic_name: "Cetirizine hydrochloride",
				dosage_form: "tablet",
				strength: "10mg",
				manufacturer: "UCB Pharma",
				requires_prescription: false,
				description: "Second-generation antihistamine for allergy relief",
				active_ingredient: "Cetirizine",
				unit_price: "0.20",
				is_active: true,
			},
		])
		.returning();

	console.log("  → inventory");
	await db.insert(schema.inventory).values([
		{
			medication_id: med1.id,
			quantity_on_hand: 500,
			reorder_threshold: 50,
			reorder_quantity: 200,
		},
		{
			medication_id: med2.id,
			quantity_on_hand: 1200,
			reorder_threshold: 100,
			reorder_quantity: 500,
		},
		{
			medication_id: med3.id,
			quantity_on_hand: 30,
			reorder_threshold: 50,
			reorder_quantity: 300,
		},
		{
			medication_id: med4.id,
			quantity_on_hand: 85,
			reorder_threshold: 20,
			reorder_quantity: 100,
		},
		{
			medication_id: med5.id,
			quantity_on_hand: 600,
			reorder_threshold: 80,
			reorder_quantity: 400,
		},
	]);

	console.log("  → inventory_batches");
	const now = new Date();
	const future6m = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
	const future12m = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
	const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const expiring15d = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

	const [batch1, batch2, batch3, batch4, batch5, batch6] = await db
		.insert(schema.inventory_batches)
		.values([
			{
				medication_id: med1.id,
				batch_number: "AMX-2025-001",
				quantity: 600,
				quantity_remaining: 500,
				expiry_date: future12m,
				manufacture_date: past30d,
				supplier: "PharmaSupply Co.",
				cost_per_unit: "0.80",
			},
			{
				medication_id: med2.id,
				batch_number: "IBU-2025-001",
				quantity: 800,
				quantity_remaining: 700,
				expiry_date: future12m,
				manufacture_date: past30d,
				supplier: "MedDistributors Ltd.",
				cost_per_unit: "0.25",
			},
			{
				medication_id: med2.id,
				batch_number: "IBU-2025-002",
				quantity: 600,
				quantity_remaining: 500,
				expiry_date: expiring15d,
				manufacture_date: past30d,
				supplier: "MedDistributors Ltd.",
				cost_per_unit: "0.25",
			},
			{
				medication_id: med3.id,
				batch_number: "MET-2025-001",
				quantity: 200,
				quantity_remaining: 30,
				expiry_date: future6m,
				manufacture_date: past30d,
				supplier: "GenericMeds Inc.",
				cost_per_unit: "0.18",
			},
			{
				medication_id: med4.id,
				batch_number: "SAL-2025-001",
				quantity: 100,
				quantity_remaining: 85,
				expiry_date: future12m,
				manufacture_date: past30d,
				supplier: "RespiCare Supplies",
				cost_per_unit: "5.00",
			},
			{
				medication_id: med5.id,
				batch_number: "CET-2025-001",
				quantity: 700,
				quantity_remaining: 600,
				expiry_date: future12m,
				manufacture_date: past30d,
				supplier: "AllergyMeds Corp.",
				cost_per_unit: "0.12",
			},
		])
		.returning();

	console.log("  → stock_transactions");
	await db.insert(schema.stock_transactions).values([
		{
			medication_id: med1.id,
			batch_id: batch1.id,
			transaction_type: "restock",
			quantity_delta: 600,
			quantity_before: 0,
			quantity_after: 600,
			reference_type: "adjustment",
			notes: "Initial stock loaded",
		},
		{
			medication_id: med2.id,
			batch_id: batch2.id,
			transaction_type: "restock",
			quantity_delta: 800,
			quantity_before: 0,
			quantity_after: 800,
			reference_type: "adjustment",
			notes: "Initial stock loaded",
		},
		{
			medication_id: med2.id,
			batch_id: batch3.id,
			transaction_type: "restock",
			quantity_delta: 600,
			quantity_before: 800,
			quantity_after: 1400,
			reference_type: "adjustment",
			notes: "Second batch received",
		},
		{
			medication_id: med2.id,
			batch_id: batch2.id,
			transaction_type: "adjustment",
			quantity_delta: -200,
			quantity_before: 1400,
			quantity_after: 1200,
			reference_type: "adjustment",
			notes: "Inventory count correction",
		},
		{
			medication_id: med3.id,
			batch_id: batch4.id,
			transaction_type: "restock",
			quantity_delta: 200,
			quantity_before: 0,
			quantity_after: 200,
			reference_type: "adjustment",
			notes: "Initial stock loaded",
		},
		{
			medication_id: med3.id,
			batch_id: batch4.id,
			transaction_type: "adjustment",
			quantity_delta: -170,
			quantity_before: 200,
			quantity_after: 30,
			reference_type: "adjustment",
			notes: "Bulk dispense to clinic",
		},
		{
			medication_id: med4.id,
			batch_id: batch5.id,
			transaction_type: "restock",
			quantity_delta: 100,
			quantity_before: 0,
			quantity_after: 100,
			reference_type: "adjustment",
			notes: "Initial stock loaded",
		},
		{
			medication_id: med4.id,
			batch_id: batch5.id,
			transaction_type: "adjustment",
			quantity_delta: -15,
			quantity_before: 100,
			quantity_after: 85,
			reference_type: "adjustment",
			notes: "Damaged units written off",
		},
		{
			medication_id: med5.id,
			batch_id: batch6.id,
			transaction_type: "restock",
			quantity_delta: 700,
			quantity_before: 0,
			quantity_after: 700,
			reference_type: "adjustment",
			notes: "Initial stock loaded",
		},
		{
			medication_id: med5.id,
			batch_id: batch6.id,
			transaction_type: "adjustment",
			quantity_delta: -100,
			quantity_before: 700,
			quantity_after: 600,
			reference_type: "adjustment",
			notes: "Inventory count correction",
		},
	]);

	console.log("  → pharmacies");
	const [pharmacy1, pharmacy2] = await db
		.insert(schema.pharmacies)
		.values([
			{
				name: "City Central Pharmacy",
				license_number: "PH-2024-001",
				address: "12 Main Street, Sarajevo 71000, Bosnia and Herzegovina",
				contact_phone: "+387 33 100 200",
				contact_email: "orders@citycentral.ba",
				is_active: true,
			},
			{
				name: "MediCare Plus",
				license_number: "PH-2024-002",
				address: "45 Ferhadija Street, Sarajevo 71000, Bosnia and Herzegovina",
				contact_phone: "+387 33 200 300",
				contact_email: "supply@medicareplus.ba",
				is_active: true,
			},
		])
		.returning();

	console.log("  → orders");
	const [order1, order2] = await db
		.insert(schema.orders)
		.values([
			{
				order_number: "ORD-20260331-1001",
				pharmacy_id: pharmacy1.id,
				status: "fulfilled",
				total_amount: "262.50",
				notes: "Urgent restock request",
				fulfilled_at: new Date(),
			},
			{
				order_number: "ORD-20260331-1002",
				pharmacy_id: pharmacy2.id,
				status: "submitted",
				total_amount: "170.00",
				notes: "Monthly standing order",
			},
		])
		.returning();

	console.log("  → order_items");
	await db.insert(schema.order_items).values([
		{
			order_id: order1.id,
			medication_id: med1.id,
			quantity_ordered: 100,
			quantity_fulfilled: 100,
			unit_price: "1.25",
			line_total: "125.00",
		},
		{
			order_id: order1.id,
			medication_id: med2.id,
			quantity_ordered: 150,
			quantity_fulfilled: 150,
			unit_price: "0.45",
			line_total: "67.50",
		},
		{
			order_id: order1.id,
			medication_id: med4.id,
			quantity_ordered: 8,
			quantity_fulfilled: 8,
			unit_price: "8.50",
			line_total: "68.00",
		},

		{
			order_id: order2.id,
			medication_id: med3.id,
			quantity_ordered: 200,
			quantity_fulfilled: 0,
			unit_price: "0.30",
			line_total: "60.00",
		},
		{
			order_id: order2.id,
			medication_id: med5.id,
			quantity_ordered: 500,
			quantity_fulfilled: 0,
			unit_price: "0.20",
			line_total: "100.00",
		},
		{
			order_id: order2.id,
			medication_id: med4.id,
			quantity_ordered: "2" as unknown as number,
			quantity_fulfilled: 0,
			unit_price: "8.50",
			line_total: "17.00",
		},
	]);

	console.log("  → prescriptions");
	const issuedDate = new Date("2026-03-01T09:00:00Z");
	const expiryDate = new Date("2026-06-01T09:00:00Z");
	const expiredDate = new Date("2026-02-01T09:00:00Z");

	const [rx1, rx2, rx3] = await db
		.insert(schema.prescriptions)
		.values([
			{
				prescription_number: "RX-20260301-0001",
				patient_name: "Amra Hodžić",
				patient_date_of_birth: new Date("1985-07-14"),
				patient_contact: "+387 61 100 200",
				patient_address: "Titova 10, Sarajevo",
				doctor_name: "Dr. Emir Kovačević",
				doctor_license_number: "DR-BA-2019-0042",
				doctor_contact: "+387 33 300 400",
				doctor_specialization: "Internal Medicine",
				status: "dispensed",
				issued_date: issuedDate,
				expiry_date: expiryDate,
				dispensed_at: new Date("2026-03-02T10:00:00Z"),
				notes: "Patient has penicillin tolerance confirmed",
			},
			{
				prescription_number: "RX-20260310-0002",
				patient_name: "Mirko Petrović",
				patient_date_of_birth: new Date("1962-03-22"),
				patient_contact: "+387 62 200 300",
				patient_address: "Obala 5, Mostar",
				doctor_name: "Dr. Lejla Softić",
				doctor_license_number: "DR-BA-2021-0117",
				doctor_contact: "+387 36 100 200",
				doctor_specialization: "Endocrinology",
				status: "verified",
				issued_date: new Date("2026-03-10T08:00:00Z"),
				expiry_date: expiryDate,
				notes: "Long-term diabetes management",
			},
			{
				prescription_number: "RX-20260315-0003",
				patient_name: "Jasmina Begić",
				patient_date_of_birth: new Date("1990-11-05"),
				patient_contact: "+387 63 300 400",
				patient_address: "Ferhadija 22, Sarajevo",
				doctor_name: "Dr. Tarik Mujić",
				doctor_license_number: "DR-BA-2018-0033",
				doctor_contact: "+387 33 500 600",
				doctor_specialization: "Pulmonology",
				status: "pending",
				issued_date: new Date("2026-03-15T11:00:00Z"),
				expiry_date: expiredDate,
				notes: "Asthma management — inhaler technique reviewed",
			},
		])
		.returning();

	console.log("  → prescription_items");
	await db.insert(schema.prescription_items).values([
		{
			prescription_id: rx1.id,
			medication_id: med1.id,
			quantity: 21,
			dosage_instructions: "1 capsule three times daily for 7 days",
			refills_allowed: 0,
			refills_used: 0,
			substitution_allowed: "no",
		},

		{
			prescription_id: rx2.id,
			medication_id: med3.id,
			quantity: 90,
			dosage_instructions: "1 tablet three times daily with meals",
			refills_allowed: 2,
			refills_used: 0,
			substitution_allowed: "yes",
		},

		{
			prescription_id: rx3.id,
			medication_id: med4.id,
			quantity: 1,
			dosage_instructions: "2 puffs as needed, maximum 4 times daily",
			refills_allowed: 1,
			refills_used: 0,
			substitution_allowed: "no",
		},
		{
			prescription_id: rx3.id,
			medication_id: med5.id,
			quantity: 30,
			dosage_instructions: "1 tablet daily in the morning",
			refills_allowed: 3,
			refills_used: 0,
			substitution_allowed: "yes",
		},
	]);

	console.log("  → users");
	const PASSWORD_HASH =
		"$2b$12$K8Zg0yAFJQkR3V1wLpN2EuQe5mX7tYsD4hC9jB1nM6oP0rW3iF8aG";

	const [user1, user2, user3] = await db
		.insert(schema.users)
		.values([
			{
				email: "amra.hodzic@example.ba",
				password_hash: PASSWORD_HASH,
				first_name: "Amra",
				last_name: "Hodžić",
				role: "patient",
				is_active: true,
			},
			{
				email: "mirko.petrovic@example.ba",
				password_hash: PASSWORD_HASH,
				first_name: "Mirko",
				last_name: "Petrović",
				role: "patient",
				is_active: true,
			},
			{
				email: "admin@medics.ba",
				password_hash: PASSWORD_HASH,
				first_name: "System",
				last_name: "Admin",
				role: "admin",
				is_active: true,
			},
		])
		.returning();

	console.log("  → user_medications");
	const today = new Date();
	const in90d = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
	const in30d = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

	await db.insert(schema.user_medications).values([
		{
			user_id: user1.id,
			medication_id: med1.id,
			prescription_id: rx1.id,
			dosage_instructions: "1 capsule three times daily for 7 days",
			start_date: new Date("2026-03-02T10:00:00Z"),
			end_date: new Date("2026-03-09T10:00:00Z"),
			is_active: false,
			notes: "Course completed",
		},

		{
			user_id: user1.id,
			medication_id: med5.id,
			prescription_id: null,
			dosage_instructions: "1 tablet daily in the morning",
			start_date: new Date("2026-01-01T08:00:00Z"),
			end_date: in90d,
			is_active: true,
			notes: "Seasonal allergy management",
		},

		{
			user_id: user2.id,
			medication_id: med3.id,
			prescription_id: rx2.id,
			dosage_instructions: "1 tablet three times daily with meals",
			start_date: new Date("2026-03-10T08:00:00Z"),
			end_date: in90d,
			is_active: true,
			notes: "Monitor blood glucose weekly",
		},

		{
			user_id: user2.id,
			medication_id: med2.id,
			prescription_id: null,
			dosage_instructions: "1 tablet up to three times daily with food",
			start_date: new Date("2026-03-28T00:00:00Z"),
			end_date: in30d,
			is_active: true,
			notes: "Back pain — short course",
		},
	]);

	console.log("✅ Seed complete.");
	await pool.end();
}

seed().catch((err) => {
	console.error("❌ Seed failed:", err);
	pool.end();
	process.exit(1);
});
