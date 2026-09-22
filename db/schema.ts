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

export const adminCredentials = pgTable("admin_credentials", {
  id: text("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  version: text("version").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
