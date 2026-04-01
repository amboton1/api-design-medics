import { Router } from "express";
import inventoryRouter from "./modules/inventory/inventory.routes.ts";
import medicationsRouter from "./modules/medications/medications.routes.ts";

export const router = Router();

router.use("/medications", medicationsRouter);
router.use("/inventory", inventoryRouter);
