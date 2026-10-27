import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PgDialect } from "drizzle-orm/pg-core";
import { seeds } from "../lib/content.ts";
import { articleHashtags } from "../lib/hashtags.ts";

// Replace only server/runtime and external database boundaries; run the actual queries and filtering.
const moduleUrl = source => `data:text/javascript,${encodeURIComponent(source)}`;
globalThis.publicContentFixture = { db: undefined, posts: [] };
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: moduleUrl("export {};"), shortCircuit: true };
    if (specifier === "next/cache") return { url: moduleUrl("export const unstable_cache = fn => fn;"), shortCircuit: true };
    if (context.parentURL?.endsWith("/lib/public-content.ts") && specifier === "./database")
      return { url: moduleUrl("export const getDatabase = () => globalThis.publicContentFixture.db;"), shortCircuit: true };
    if (context.parentURL?.endsWith("/lib/public-content.ts") && specifier === "./store")
      return { url: moduleUrl("export async function publishedArticles() { if (globalThis.publicContentFixture.db) throw Error('Full catalogue body load on database-backed tag query'); return globalThis.publicContentFixture.posts.filter(p => p.status === 'published' && !p.sample); }"), shortCircuit: true };
    if (specifier.startsWith("@/")) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const candidate = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
});
const { getArticlePage, getPublishedArticle } = await import("../lib/public-content.ts");
const fixture = globalThis.publicContentFixture;
const matched = { ...seeds[2], id: "z-match", sample: false, title: "모임 사진의 촬영 동의", excerpt: "동호회 사진을 찍기 전에 공유 범위와 촬영 동의를 정합니다.", tags: ["촬영동의"], body: "이 본문에만 요넥스와 스매시가 들어 있습니다. ".repeat(3) };
const other = { ...seeds[2], id: "a-other", sample: false, title: "운동 뒤 준비물 정리", excerpt: "운동을 마치고 준비물을 정리하는 방법을 함께 정합니다.", body: "본문만 있는 연습 문장입니다. ".repeat(4) };

test("tag and hashtag search use bounded body-free SQL projections and match local behavior", async () => {
  fixture.posts = [matched, other];
  fixture.db = undefined;
  const local = await getArticlePage({ tag: "촬영동의", today: "2026-10-27" });
  assert.deepEqual(local.posts.map(post => post.id), ["z-match"]);
  const statements = [];
  const dialect = new PgDialect();
  const tagRows = [...Array.from({ length: 500 }, (_, i) => ({ ...other, id: `a-${String(i).padStart(3, "0")}` })), matched];
  fixture.db = { async execute(query) {
    const statement = dialect.sqlToQuery(query);
    statements.push(statement);
    if (/ as tag\b/.test(statement.sql)) {
      assert.doesNotMatch(statement.sql, /body|images|rights|result/);
      assert.match(statement.sql, /limit 500/);
      const after = statement.params[0];
      return { rows: tagRows.filter(p => p.id > after).slice(0, 500).map(({ id, title, excerpt, category, tags, event }) => ({ tag: { id, title, excerpt, category, tags, event } })) };
    }
    assert.match(statement.sql, /id = any/);
    assert.ok(statement.params.some(value => Array.isArray(value) && value.length === 1 && value[0] === "z-match"));
    if (/count\(\*\)/.test(statement.sql)) return { rows: [{ total: 1 }] };
    return { rows: [{ preview: { id: matched.id, title: matched.title, excerpt: matched.excerpt, category: matched.category, tags: matched.tags, art: matched.art, date: matched.date, sample: false, readingMinutes: 2 } }] };
  } };
  const database = await getArticlePage({ tag: "촬영동의", today: "2026-10-27" });
  assert.deepEqual(database.posts.map(post => post.id), ["z-match"]);
  assert.deepEqual(articleHashtags(database.posts[0]), articleHashtags(local.posts[0]));
  assert.equal(statements.filter(statement => / as tag\b/.test(statement.sql)).length, 2);
  statements.length = 0;
  const hashSearch = await getArticlePage({ q: "#촬영동의", today: "2026-10-27" });
  assert.deepEqual(hashSearch.posts.map(post => post.id), ["z-match"]);
});

test("database detail predicate excludes samples even when no editorial article exists", async () => {
  let predicate;
  fixture.db = { select() { return { from() { return { where(query) { predicate = new PgDialect().sqlToQuery(query).sql; return { limit: async () => [] }; } }; } }; } };
  assert.equal(await getPublishedArticle("first-racket"), null);
  assert.match(predicate, /sample/);
  assert.doesNotMatch(predicate, /not exists/i);
});
