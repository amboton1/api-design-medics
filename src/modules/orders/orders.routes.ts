import { Router } from "express";
import { authenticateToken, authorize } from "../../middleware/auth.ts";
import { validate } from "../../middleware/validate.ts";
import * as service from "./orders.service.ts";
import {
  addOrderItemSchema,
  insertOrderSchema,
  insertPharmacySchema,
  type OrderQuery,
  orderIdSchema,
  orderItemParamSchema,
  orderQuerySchema,
  type PharmacyQuery,
  pharmacyIdSchema,
  pharmacyQuerySchema,
  updateOrderItemSchema,
  updateOrderSchema,
  updatePharmacySchema,
} from "./orders.validators.ts";

const router = Router();

router.get(
  "/pharmacies",
  authenticateToken,
  validate(pharmacyQuerySchema, "query"),
  async (req, res) => {
    const query = pharmacyQuerySchema.parse(req.query) as PharmacyQuery;
    const result = await service.getPharmacies(query);
    res.json({ success: true, ...result });
  },
);

router.get(
  "/pharmacies/:id",
  authenticateToken,
  validate(pharmacyIdSchema, "params"),
  async (req, res) => {
    const { id } = pharmacyIdSchema.parse(req.params);
    const pharmacy = await service.getPharmacyById(id);
    res.json({ success: true, data: pharmacy });
  },
);

router.post(
  "/pharmacies",
  authenticateToken,
  authorize("admin"),
  validate(insertPharmacySchema),
  async (req, res) => {
    const pharmacy = await service.createPharmacy(req.body);
    res.status(201).json({ success: true, data: pharmacy });
  },
);

router.patch(
  "/pharmacies/:id",
  authenticateToken,
  authorize("admin"),
  validate(pharmacyIdSchema, "params"),
  validate(updatePharmacySchema),
  async (req, res) => {
    const { id } = pharmacyIdSchema.parse(req.params);
    const pharmacy = await service.updatePharmacy(id, req.body);
    res.json({ success: true, data: pharmacy });
  },
);

router.delete(
  "/pharmacies/:id",
  authenticateToken,
  authorize("admin"),
  validate(pharmacyIdSchema, "params"),
  async (req, res) => {
    const { id } = pharmacyIdSchema.parse(req.params);
    const pharmacy = await service.deletePharmacy(id);
    res.json({ success: true, data: pharmacy });
  },
);

router.get(
  "/",
  authenticateToken,
  validate(orderQuerySchema, "query"),
  async (req, res) => {
    const query = orderQuerySchema.parse(req.query) as OrderQuery;
    const result = await service.getOrders(query);
    res.json({ success: true, ...result });
  },
);

router.get(
  "/:id",
  authenticateToken,
  validate(orderIdSchema, "params"),
  async (req, res) => {
    const { id } = orderIdSchema.parse(req.params);
    const order = await service.getOrderById(id);
    res.json({ success: true, data: order });
  },
);

router.post(
  "/",
  authenticateToken,
  authorize("admin"),
  validate(insertOrderSchema),
  async (req, res) => {
    const order = await service.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  },
);

router.patch(
  "/:id",
  authenticateToken,
  authorize("admin"),
  validate(orderIdSchema, "params"),
  validate(updateOrderSchema),
  async (req, res) => {
    const { id } = orderIdSchema.parse(req.params);
    const order = await service.updateOrder(id, req.body);
    res.json({ success: true, data: order });
  },
);

router.delete(
  "/:id",
  authenticateToken,
  authorize("admin"),
  validate(orderIdSchema, "params"),
  async (req, res) => {
    const { id } = orderIdSchema.parse(req.params);
    const order = await service.cancelOrder(id);
    res.json({ success: true, data: order });
  },
);

router.get(
  "/:id/items",
  authenticateToken,
  validate(orderIdSchema, "params"),
  async (req, res) => {
    const { id } = orderIdSchema.parse(req.params);
    const items = await service.getOrderItems(id);
    res.json({ success: true, data: items });
  },
);

router.post(
  "/:id/items",
  authenticateToken,
  authorize("admin"),
  validate(orderIdSchema, "params"),
  validate(addOrderItemSchema),
  async (req, res) => {
    const { id } = orderIdSchema.parse(req.params);
    const item = await service.addOrderItem(id, req.body);
    res.status(201).json({ success: true, data: item });
  },
);

router.patch(
  "/:id/items/:itemId",
  authenticateToken,
  authorize("admin"),
  validate(orderItemParamSchema, "params"),
  validate(updateOrderItemSchema),
  async (req, res) => {
    const { id, itemId } = orderItemParamSchema.parse(req.params);
    const item = await service.updateOrderItem(id, itemId, req.body);
    res.json({ success: true, data: item });
  },
);

router.delete(
  "/:id/items/:itemId",
  authenticateToken,
  authorize("admin"),
  validate(orderItemParamSchema, "params"),
  async (req, res) => {
    const { id, itemId } = orderItemParamSchema.parse(req.params);
    const item = await service.removeOrderItem(id, itemId);
    res.json({ success: true, data: item });
  },
);

export default router;
