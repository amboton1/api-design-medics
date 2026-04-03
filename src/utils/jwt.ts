import { createSecretKey } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import env from "../../env.ts";

export type UserRole = "patient" | "doctor" | "pharmacist" | "admin";

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

const getSecretKey = () => createSecretKey(env.JWT_SECRET, "utf-8");

export const generateToken = (payload: JwtPayload): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN || "7d")
    .sign(getSecretKey());
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, getSecretKey());
  return payload as unknown as JwtPayload;
};
