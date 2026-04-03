import { Router } from "express";
import { authRouter } from "./auth/authRoutes.ts";
import { usersRouter } from "./auth/usersRoutes.ts";
import { authenticateToken } from "./middleware/auth.ts";
import inventoryRouter from "./modules/inventory/inventory.routes.ts";
import medicationsRouter from "./modules/medications/medications.routes.ts";
import prescriptionsRouter from "./modules/prescriptions/prescriptions.routes.ts";

export const router = Router();

router.use("/auth/users", usersRouter);
router.use("/auth", authRouter);
router.use("/medications", medicationsRouter);
router.use("/inventory", inventoryRouter);
router.use("/prescriptions", prescriptionsRouter);

router.get("/protected", authenticateToken, (req, res) => {
  res.json({ success: true, message: "Access granted", user: req.user });
});
