import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/index.ts";
import { users } from "../db/schema/index.ts";
import { AppError } from "../lib/AppError.ts";
import { generateToken } from "../utils/jwt.ts";
import { comparePassword, hashPassword } from "../utils/password.ts";

export async function register(req: Request, res: Response) {
  const { email, password, first_name, last_name, role } = req.body;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existing) throw new AppError(409, "Email already in use");

  const password_hash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email, password_hash, first_name, last_name, role })
    .returning();

  const token = await generateToken({
    id: user.id,
    email: user.email,
    username: user.first_name,
    role: user.role,
  });

  const { password_hash: _, ...userData } = user;

  res.status(201).json({ success: true, token, data: userData });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new AppError(401, "Invalid credentials");

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) throw new AppError(401, "Invalid credentials");

  const token = await generateToken({
    id: user.id,
    email: user.email,
    username: user.first_name,
    role: user.role,
  });

  const { password_hash: _, ...userData } = user;

  res.status(200).json({ success: true, token, data: userData });
}
