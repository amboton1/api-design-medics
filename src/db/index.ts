import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { remember } from "@epic-web/remember";
import env from "../../env.ts";
import * as schema from "./schema/index.ts";

const pool = remember(
  "pg_pool",
  () => new Pool({ connectionString: env.DATABASE_URL }),
);

export const db = drizzle(pool, { schema });
export type DB = typeof db;
