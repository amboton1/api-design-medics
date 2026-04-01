import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/AppError.ts";
import env from "../../env.ts";

type PostgresError = Error & { code?: string; detail?: string };

const PG_ERROR_MESSAGES: Record<string, string> = {
	"22003": "A numeric value is out of the allowed range.",
	"23505": "A record with that value already exists.",
	"23503": "Referenced record does not exist.",
	"23502": "A required field is missing.",
};

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	const pgErr = err as PostgresError;
	if (pgErr?.code && pgErr.code in PG_ERROR_MESSAGES) {
		res.status(400).json({
			success: false,
			message: PG_ERROR_MESSAGES[pgErr.code],
		});
		return;
	}

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

	const isProd = env.APP_STAGE === "production";
	res.status(500).json({
		success: false,
		message: "Internal server error",
		...(isProd
			? {}
			: { stack: err instanceof Error ? err.stack : String(err) }),
	});
}
