import { Router } from "express";
import { login, register } from "../controllers/authController.ts";
import { validate } from "../middleware/validate.ts";
import { insertUserSchema, loginSchema } from "./authValidators.ts";

const router = Router();

router.post("/login", validate(loginSchema), login);

router.post("/register", validate(insertUserSchema), register);

export { router as authRouter };

export default router;
