import { Router } from "express";
import { authenticateToken, authorize } from "../../middleware/auth.ts";
import { validate } from "../../middleware/validate.ts";
import * as service from "./prescriptions.service.ts";
import {
  insertPrescriptionSchema,
  type PrescriptionQuery,
  prescriptionIdSchema,
  prescriptionQuerySchema,
  updatePrescriptionSchema,
  updatePrescriptionStatusSchema,
} from "./prescriptions.validators.ts";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorize("doctor", "pharmacist", "admin"),
  validate(prescriptionQuerySchema, "query"),
  async (req, res) => {
    const query = prescriptionQuerySchema.parse(req.query) as PrescriptionQuery;
    const result = await service.getPrescriptions(query);
    res.json({ success: true, ...result });
  },
);

router.get(
  "/:id",
  authenticateToken,
  authorize("doctor", "pharmacist", "admin"),
  validate(prescriptionIdSchema, "params"),
  async (req, res) => {
    const { id } = prescriptionIdSchema.parse(req.params);
    const prescription = await service.getPrescriptionById(id);
    res.json({ success: true, data: prescription });
  },
);

router.post(
  "/",
  authenticateToken,
  authorize("doctor", "admin"),
  validate(insertPrescriptionSchema),
  async (req, res) => {
    const prescription = await service.createPrescription(req.body);
    res.status(201).json({ success: true, data: prescription });
  },
);

router.patch(
  "/:id",
  authenticateToken,
  authorize("doctor", "admin"),
  validate(prescriptionIdSchema, "params"),
  validate(updatePrescriptionSchema),
  async (req, res) => {
    const { id } = prescriptionIdSchema.parse(req.params);
    const prescription = await service.updatePrescription(id, req.body);
    res.json({ success: true, data: prescription });
  },
);

router.patch(
  "/:id/status",
  authenticateToken,
  authorize("pharmacist", "admin"),
  validate(prescriptionIdSchema, "params"),
  validate(updatePrescriptionStatusSchema),
  async (req, res) => {
    const { id } = prescriptionIdSchema.parse(req.params);
    const prescription = await service.updatePrescriptionStatus(id, req.body);
    res.json({ success: true, data: prescription });
  },
);

router.delete(
  "/:id",
  authenticateToken,
  authorize("admin"),
  validate(prescriptionIdSchema, "params"),
  async (req, res) => {
    const { id } = prescriptionIdSchema.parse(req.params);
    const prescription = await service.deletePrescription(id);
    res.json({ success: true, data: prescription });
  },
);

export default router;
