import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
	res.status(200).json({ message: "Users endpoint" });
});

router.get("/:id", (req, res) => {
	const { id } = req.params;
	res.status(200).json({ message: `User details for ID: ${id}` });
});

router.put("/:id", (req, res) => {
	const { id } = req.params;
	res.status(200).json({ message: `User with ID: ${id} updated` });
});

router.delete("/:id", (req, res) => {
	const { id } = req.params;
	res.status(200).json({ message: `User with ID: ${id} deleted` });
});

export { router as usersRouter };

export default router;
