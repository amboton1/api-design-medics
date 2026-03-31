import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  APP_STAGE: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().positive().default(3000),
  DATABASE_URL: z
    .string()
    .refine(
      (url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
      { message: "DATABASE_URL must start with postgres:// or postgresql://" },
    )
    .default("postgresql://user:password@localhost:5432/mydb"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(20).default(12),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    error.issues.forEach((err) => {
      const path = err.path.join(".");
      console.error(`  ${path}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export const isProd = () => env.NODE_ENV === "production";
export const isDev = () => env.NODE_ENV === "development";
export const isTestEnv = () => env.NODE_ENV === "test";

export { env };

export default env;
