import { Router } from "express";
import { validate } from "../../middleware/validate.ts";
import * as service from "./prescriptions.service.ts";
import {
  insertPrescriptionSchema,
  updatePrescriptionSchema,
  updatePrescriptionStatusSchema,
  prescriptionIdSchema,
  prescriptionQuerySchema,
  type PrescriptionQuery,
} from "./prescriptions.validators.ts";

const router = Router();

router.get(
  "/",
  validate(prescriptionQuerySchema, "query"),
  async (req, res) => {
    const query = prescriptionQuerySchema.parse(req.query) as PrescriptionQuery;
    const result = await service.getPrescriptions(query);
    res.json({ success: true, ...result });
  },
);

router.get(
  "/:id",
  validate(prescriptionIdSchema, "params"),
  async (req, res) => {
    const { id } = prescriptionIdSchema.parse(req.params);
    const prescription = await service.getPrescriptionById(id);
    res.json({ success: true, data: prescription });
  },
);

router.post("/", validate(insertPrescriptionSchema), async (req, res) => {
  const prescription = await service.createPrescription(req.body);
  res.status(201).json({ success: true, data: prescription });
});

router.patch(
  "/:id",
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
  validate(prescriptionIdSchema, "params"),
  async (req, res) => {
    const { id } = prescriptionIdSchema.parse(req.params);
    const prescription = await service.deletePrescription(id);
    res.json({ success: true, data: prescription });
  },
);

export default router;
