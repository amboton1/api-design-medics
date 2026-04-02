import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { inventory, inventory_batches } from "../../db/schema/index.ts";

export const insertInventorySchema = createInsertSchema(inventory, {
  quantity_on_hand: (s) => s.min(0),
  reorder_threshold: (s) => s.min(1),
  reorder_quantity: (s) => s.min(1),
  unit_of_measure: (s) => s.min(1).max(50),
}).omit({ id: true, updated_at: true });

export const updateInventorySchema = createUpdateSchema(inventory, {
  reorder_threshold: (s) => s.min(1),
  reorder_quantity: (s) => s.min(1),
  unit_of_measure: (s) => s.min(1).max(50),
}).omit({
  id: true,
  updated_at: true,
  medication_id: true,
  quantity_on_hand: true,
});

export const insertBatchSchema = createInsertSchema(inventory_batches, {
  batch_number: (s) => s.min(1).max(100),
  quantity: (s) => s.min(1),
  quantity_remaining: (s) => s.min(0),
  cost_per_unit: (s) =>
    s
      .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price (e.g. 1.25)")
      .optional(),
})
  .omit({ id: true, created_at: true, medication_id: true })
  .refine((d) => d.quantity_remaining <= d.quantity, {
    message: "quantity_remaining cannot exceed quantity",
    path: ["quantity_remaining"],
  });

export const insertTransactionSchema = z.object({
  transaction_type: z.enum([
    "restock",
    "prescription_dispense",
    "order_fulfillment",
    "adjustment",
    "expiry_write_off",
    "return",
  ]),
  quantity_delta: z
    .number()
    .int()
    .refine((n) => n !== 0, "quantity_delta must be nonzero"),
  batch_id: z.uuid().optional(),
  reference_id: z.uuid().optional(),
  reference_type: z.string().max(50).optional(),
  notes: z.string().optional(),
});

export const medicationIdParamSchema = z.object({
  medication_id: z.uuid("Invalid medication ID"),
});

export const batchParamSchema = z.object({
  medication_id: z.uuid("Invalid medication ID"),
  batch_id: z.uuid("Invalid batch ID"),
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  low_stock: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const batchQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  expired: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  transaction_type: z
    .enum([
      "restock",
      "prescription_dispense",
      "order_fulfillment",
      "adjustment",
      "expiry_write_off",
      "return",
    ])
    .optional(),
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type UpdateInventory = z.infer<typeof updateInventorySchema>;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type BatchQuery = z.infer<typeof batchQuerySchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
