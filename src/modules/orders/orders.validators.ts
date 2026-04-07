import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { orders, pharmacies } from "../../db/schema/index.ts";

export const selectPharmacySchema = createSelectSchema(pharmacies);

export const insertPharmacySchema = createInsertSchema(pharmacies, {
  name: (s) => s.min(2).max(255),
  license_number: (s) => s.min(1).max(100),
  address: (s) => s.min(5),
}).omit({ id: true, created_at: true, updated_at: true });

export const updatePharmacySchema = createUpdateSchema(pharmacies, {
  name: (s) => s.min(2).max(255),
  license_number: (s) => s.min(1).max(100),
  address: (s) => s.min(5),
}).omit({ id: true, created_at: true, updated_at: true });

export const pharmacyIdSchema = z.object({
  id: z.uuid("Invalid pharmacy ID"),
});

export const pharmacyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  is_active: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

const orderItemSchema = z.object({
  medication_id: z.uuid("Invalid medication ID"),
  quantity_ordered: z.number().int().positive(),
  unit_price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price (e.g. 9.99)"),
});

export const insertOrderSchema = createInsertSchema(orders, {
  order_number: (s) => s.min(1).max(50),
  notes: (s) => s.max(1000),
})
  .omit({
    id: true,
    status: true,
    total_amount: true,
    fulfilled_at: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  });

export const updateOrderSchema = z.object({
  status: z
    .enum([
      "draft",
      "submitted",
      "confirmed",
      "processing",
      "fulfilled",
      "partially_fulfilled",
      "cancelled",
    ])
    .optional(),
  notes: z.string().max(1000).nullish(),
});

export const orderIdSchema = z.object({
  id: z.uuid("Invalid order ID"),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  pharmacy_id: z.uuid("Invalid pharmacy ID").optional(),
  status: z
    .enum([
      "draft",
      "submitted",
      "confirmed",
      "processing",
      "fulfilled",
      "partially_fulfilled",
      "cancelled",
    ])
    .optional(),
});

export const addOrderItemSchema = orderItemSchema;

export const updateOrderItemSchema = z.object({
  quantity_ordered: z.number().int().positive().optional(),
  quantity_fulfilled: z.number().int().min(0).optional(),
  unit_price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price (e.g. 9.99)")
    .optional(),
});

export const orderItemParamSchema = z.object({
  id: z.uuid("Invalid order ID"),
  itemId: z.uuid("Invalid item ID"),
});

export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;
export type UpdatePharmacy = z.infer<typeof updatePharmacySchema>;
export type PharmacyQuery = z.infer<typeof pharmacyQuerySchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type AddOrderItem = z.infer<typeof addOrderItemSchema>;
export type UpdateOrderItem = z.infer<typeof updateOrderItemSchema>;
