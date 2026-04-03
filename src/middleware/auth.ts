import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/AppError.ts";
import { type JwtPayload, type UserRole, verifyToken } from "../utils/jwt.ts";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) throw new AppError(401, "No token provided");

  try {
    req.user = await verifyToken(token);
    next();
  } catch {
    return next(new AppError(403, "Forbidden: Invalid token"));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, "Forbidden");
    }
    next();
  };
}
