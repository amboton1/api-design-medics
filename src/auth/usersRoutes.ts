import { Router } from "express";
import { authenticateToken, authorize } from "../middleware/auth.ts";

const router = Router();

router.get("/", authenticateToken, authorize("admin"), (_req, res) => {
  res.status(200).json({ message: "Users endpoint" });
});

router.get("/:id", authenticateToken, authorize("admin"), (req, res) => {
  const { id } = req.params;
  res.status(200).json({ message: `User details for ID: ${id}` });
});

router.put("/:id", authenticateToken, authorize("admin"), (req, res) => {
  const { id } = req.params;
  res.status(200).json({ message: `User with ID: ${id} updated` });
});

router.delete("/:id", authenticateToken, authorize("admin"), (req, res) => {
  const { id } = req.params;
  res.status(200).json({ message: `User with ID: ${id} deleted` });
});

export { router as usersRouter };

export default router;
