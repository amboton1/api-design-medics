import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../db/schema/index.ts";

export const insertUserSchema = createInsertSchema(users, {
  email: (s) => s.email("Invalid email address"),
  first_name: (s) => s.min(1).max(100),
  last_name: (s) => s.min(1).max(100),
})
  .omit({
    id: true,
    password_hash: true,
    is_active: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginUser = z.infer<typeof loginSchema>;
