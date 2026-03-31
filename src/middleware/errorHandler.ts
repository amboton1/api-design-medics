import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/AppError.ts";
import env from "../../env.ts";

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			success: false,
			message: err.message,
			...(err.details ? { errors: err.details } : {}),
		});
		return;
	}

	if (err instanceof ZodError) {
		res.status(400).json({
			success: false,
			message: "Validation error",
			errors: err.flatten().fieldErrors,
		});
		return;
	}

	const isProd = env.NODE_ENV === "production";
	res.status(500).json({
		success: false,
		message: "Internal server error",
		...(isProd
			? {}
			: { stack: err instanceof Error ? err.stack : String(err) }),
	});
}
