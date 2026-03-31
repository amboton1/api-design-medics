CREATE TYPE "public"."dosage_form" AS ENUM('tablet', 'capsule', 'liquid', 'injection', 'cream', 'inhaler', 'patch', 'suppository', 'drops', 'other');
CREATE TYPE "public"."transaction_type" AS ENUM('restock', 'prescription_dispense', 'order_fulfillment', 'adjustment', 'expiry_write_off', 'return');
CREATE TYPE "public"."prescription_status" AS ENUM('pending', 'verified', 'dispensed', 'partially_dispensed', 'cancelled', 'expired');
CREATE TYPE "public"."order_status" AS ENUM('draft', 'submitted', 'confirmed', 'processing', 'fulfilled', 'partially_fulfilled', 'cancelled');
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"generic_name" varchar(255),
	"dosage_form" "dosage_form" NOT NULL,
	"strength" varchar(100) NOT NULL,
	"manufacturer" varchar(255) NOT NULL,
	"requires_prescription" boolean DEFAULT false NOT NULL,
	"description" text,
	"active_ingredient" varchar(255),
	"unit_price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_id" uuid NOT NULL,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"reorder_threshold" integer DEFAULT 20 NOT NULL,
	"reorder_quantity" integer DEFAULT 100 NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'units' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_medication_id_unique" UNIQUE("medication_id")
);

CREATE TABLE "inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_id" uuid NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"quantity_remaining" integer NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"manufacture_date" timestamp with time zone,
	"supplier" varchar(255),
	"cost_per_unit" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "stock_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_id" uuid NOT NULL,
	"batch_id" uuid,
	"transaction_type" "transaction_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"quantity_before" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "prescription_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"dosage_instructions" text NOT NULL,
	"refills_allowed" integer DEFAULT 0 NOT NULL,
	"refills_used" integer DEFAULT 0 NOT NULL,
	"substitution_allowed" varchar(10) DEFAULT 'no' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_number" varchar(50) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_date_of_birth" timestamp with time zone,
	"patient_contact" varchar(100),
	"patient_address" text,
	"doctor_name" varchar(255) NOT NULL,
	"doctor_license_number" varchar(100) NOT NULL,
	"doctor_contact" varchar(100),
	"doctor_specialization" varchar(100),
	"status" "prescription_status" DEFAULT 'pending' NOT NULL,
	"issued_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"dispensed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prescriptions_prescription_number_unique" UNIQUE("prescription_number")
);

CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"quantity_ordered" integer NOT NULL,
	"quantity_fulfilled" integer DEFAULT 0 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(12, 2),
	"notes" text,
	"fulfilled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);

CREATE TABLE "pharmacies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"license_number" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"contact_phone" varchar(50),
	"contact_email" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pharmacies_license_number_unique" UNIQUE("license_number")
);

ALTER TABLE "inventory" ADD CONSTRAINT "inventory_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE restrict ON UPDATE no action;