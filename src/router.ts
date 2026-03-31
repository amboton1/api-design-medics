import { Router } from "express";
import medicationsRouter from "./modules/medications/medications.routes.ts";

export const router = Router();

router.use("/medications", medicationsRouter);
