import { Router } from "express";
import { authenticateToken, authorize } from "../../middleware/auth.ts";
import { validate } from "../../middleware/validate.ts";
import * as service from "./inventory.service.ts";
import {
  type BatchQuery,
  batchParamSchema,
  batchQuerySchema,
  type InventoryQuery,
  insertBatchSchema,
  insertInventorySchema,
  insertTransactionSchema,
  inventoryQuerySchema,
  medicationIdParamSchema,
  type TransactionQuery,
  transactionQuerySchema,
  updateInventorySchema,
} from "./inventory.validators.ts";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(inventoryQuerySchema, "query"),
  async (req, res) => {
    const query = inventoryQuerySchema.parse(req.query) as InventoryQuery;
    const result = await service.getInventory(query);
    res.json({ success: true, ...result });
  },
);

router.post(
  "/",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(insertInventorySchema),
  async (req, res) => {
    const item = await service.createInventory(req.body);
    res.status(201).json({ success: true, data: item });
  },
);

router.get(
  "/:medication_id",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(medicationIdParamSchema, "params"),
  async (req, res) => {
    const { medication_id } = medicationIdParamSchema.parse(req.params);
    const item = await service.getInventoryByMedicationId(medication_id);
    res.json({ success: true, data: item });
  },
);

router.patch(
  "/:medication_id",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(medicationIdParamSchema, "params"),
  validate(updateInventorySchema),
  async (req, res) => {
    const { medication_id } = medicationIdParamSchema.parse(req.params);
    const item = await service.updateInventory(medication_id, req.body);
    res.json({ success: true, data: item });
  },
);

router.get(
  "/:medication_id/batches",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(medicationIdParamSchema, "params"),
  validate(batchQuerySchema, "query"),
  async (req, res) => {
    const { medication_id } = medicationIdParamSchema.parse(req.params);
    const query = batchQuerySchema.parse(req.query) as BatchQuery;
    const result = await service.getBatches(medication_id, query);
    res.json({ success: true, ...result });
  },
);

router.post(
  "/:medication_id/batches",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(medicationIdParamSchema, "params"),
  validate(insertBatchSchema),
  async (req, res) => {
    const { medication_id } = medicationIdParamSchema.parse(req.params);
    const batch = await service.createBatch(medication_id, req.body);
    res.status(201).json({ success: true, data: batch });
  },
);

router.get(
  "/:medication_id/batches/:batch_id",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(batchParamSchema, "params"),
  async (req, res) => {
    const { batch_id } = batchParamSchema.parse(req.params);
    const batch = await service.getBatchById(batch_id);
    res.json({ success: true, data: batch });
  },
);

router.get(
  "/:medication_id/transactions",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(medicationIdParamSchema, "params"),
  validate(transactionQuerySchema, "query"),
  async (req, res) => {
    const { medication_id } = medicationIdParamSchema.parse(req.params);
    const query = transactionQuerySchema.parse(req.query) as TransactionQuery;
    const result = await service.getTransactions(medication_id, query);
    res.json({ success: true, ...result });
  },
);

router.post(
  "/:medication_id/transactions",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(medicationIdParamSchema, "params"),
  validate(insertTransactionSchema),
  async (req, res) => {
    const { medication_id } = medicationIdParamSchema.parse(req.params);
    const transaction = await service.createTransaction(
      medication_id,
      req.body,
    );
    res.status(201).json({ success: true, data: transaction });
  },
);

export default router;
