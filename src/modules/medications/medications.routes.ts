import { Router } from "express";
import { authenticateToken, authorize } from "../../middleware/auth.ts";
import { validate } from "../../middleware/validate.ts";
import * as service from "./medications.service.ts";
import {
  insertMedicationSchema,
  type MedicationQuery,
  medicationIdSchema,
  medicationQuerySchema,
  updateMedicationSchema,
} from "./medications.validators.ts";

const router = Router();

router.get(
  "/",
  authenticateToken,
  validate(medicationQuerySchema, "query"),
  async (req, res) => {
    const query = medicationQuerySchema.parse(req.query) as MedicationQuery;
    const result = await service.getMedications(query);
    res.json({ success: true, ...result });
  },
);

router.get(
  "/:id",
  authenticateToken,
  validate(medicationIdSchema, "params"),
  async (req, res) => {
    const { id } = medicationIdSchema.parse(req.params);
    const medication = await service.getMedicationById(id);
    res.json({ success: true, data: medication });
  },
);

router.post(
  "/",
  authenticateToken,
  authorize("admin"),
  validate(insertMedicationSchema),
  async (req, res) => {
    const medication = await service.createMedication(req.body);
    res.status(201).json({ success: true, data: medication });
  },
);

router.patch(
  "/:id",
  authenticateToken,
  authorize("admin"),
  validate(medicationIdSchema, "params"),
  validate(updateMedicationSchema),
  async (req, res) => {
    const { id } = medicationIdSchema.parse(req.params);
    const medication = await service.updateMedication(id, req.body);
    res.json({ success: true, data: medication });
  },
);

router.delete(
  "/:id",
  authenticateToken,
  authorize("admin"),
  validate(medicationIdSchema, "params"),
  async (req, res) => {
    const { id } = medicationIdSchema.parse(req.params);
    const medication = await service.deleteMedication(id);
    res.json({ success: true, data: medication });
  },
);

export default router;
