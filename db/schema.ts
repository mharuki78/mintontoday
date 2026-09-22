import { pgTable, text, jsonb, integer, bigint } from "drizzle-orm/pg-core";
import type { Article } from "../lib/content";

export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<Article>().notNull(),
});

export const loginLimits = pgTable("login_limits", {
  key: text("key").primaryKey(),
  windowStart: bigint("window_start", { mode: "number" }).notNull(),
  attempts: integer("attempts").notNull(),
});
