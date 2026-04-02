import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../lib/AppError.ts";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(
        new AppError(
          400,
          "Validation failed",
          result.error.flatten().fieldErrors,
        ),
      );
    }

    if (part === "body") {
      req.body = result.data;
    }
    next();
  };
}
