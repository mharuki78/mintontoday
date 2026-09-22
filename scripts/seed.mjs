import { readFile } from "node:fs/promises";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { articles } from "../db/schema.ts";
import { seeds, articleSchema } from "../lib/content.ts";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
let data = seeds;
try {
  data = articleSchema
    .array()
    .parse(JSON.parse(await readFile("data/posts.json", "utf8")));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const db = drizzle(neon(process.env.DATABASE_URL));
// Idempotent import: never replace remotely edited content.
await db
  .insert(articles)
  .values(data.map((post) => ({ id: post.id, data: post })))
  .onConflictDoNothing();
console.log(
  `Imported up to ${data.length} articles without overwriting existing rows.`,
);
