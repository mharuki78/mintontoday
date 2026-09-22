import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
await migrate(drizzle(neon(url)), { migrationsFolder: "./db/migrations" });
console.log("Database migrations applied.");
