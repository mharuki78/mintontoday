import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
let database: ReturnType<typeof drizzle> | undefined;
export function getDatabase() {
  if (!process.env.DATABASE_URL) {
    if (process.env.VERCEL)
      throw new Error("DATABASE_URL is required on Vercel");
    return undefined;
  }
  return (database ??= drizzle(neon(process.env.DATABASE_URL)));
}
