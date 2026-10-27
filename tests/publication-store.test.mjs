import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PgDialect } from "drizzle-orm/pg-core";
import { seeds } from "../lib/content.ts";

const moduleUrl = source => `data:text/javascript,${encodeURIComponent(source)}`;
globalThis.publicationStoreFixture = { rows: [], queries: [] };
const fixture = globalThis.publicationStoreFixture;
fixture.db = { select(fields) {
  const entry = { fields, where: null };
  fixture.queries.push(entry);
  return { from() { return {
    then(resolve) { resolve(fixture.rows); },
    where(query) {
      entry.where = new PgDialect().sqlToQuery(query);
      return { async limit() { return fixture.rows.filter(row => row.id === entry.where.params[0]).slice(0, 1); } };
    },
  }; } };
} };
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: moduleUrl("export {};"), shortCircuit: true };
  if (context.parentURL?.endsWith("/lib/store.ts") && specifier === "./database")
    return { url: moduleUrl("export const getDatabase = () => globalThis.publicationStoreFixture.db;"), shortCircuit: true };
  if (specifier.startsWith("@/")) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const candidate = new URL(specifier + ".ts", context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
  }
  return next(specifier, context);
} });
const { publishedArticles, getStoredArticle } = await import("../lib/store.ts");

test("samples-only and fully withdrawn catalogues remain empty on the actual store public read", async () => {
  fixture.rows = seeds.map(data => ({ id: data.id, data }));
  assert.deepEqual(await publishedArticles(), []);
  fixture.rows.push({ id: "withdrawn", data: { ...seeds[2], id: "withdrawn", sample: false, status: "draft" } });
  assert.deepEqual(await publishedArticles(), []);
});

test("manual-save prior lookup reads one selected id and retains draft and legacy metadata", async () => {
  const draft = { ...seeds[2], id: "private-draft", sample: false, status: "draft", updatedAt: "2026-09-23T00:00:00.000Z" };
  fixture.rows = [{ id: draft.id, data: draft }, ...seeds.map(data => ({ id: data.id, data }))];
  fixture.queries.length = 0;
  const prior = await getStoredArticle("private-draft");
  assert.equal(prior.status, "draft");
  assert.equal(prior.updatedAt, "2026-09-23T00:00:00.000Z");
  assert.equal(fixture.queries.length, 1);
  assert.deepEqual(Object.keys(fixture.queries[0].fields), ["data"]);
  assert.deepEqual(fixture.queries[0].where.params, ["private-draft"]);
  assert.equal(await getStoredArticle("missing-post"), null);
});
