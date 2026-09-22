import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { articleSchema, seeds } from "../lib/content.ts";
const batch = JSON.parse(await readFile(new URL("../content/2026-09-22.json", import.meta.url), "utf8"));
const posts = batch.map(e => e.article);
test("launch articles meet editorial requirements and stable ids are unique", () => {
  assert.equal(new Set(posts.map(p => p.id)).size, posts.length);
  assert.equal(posts.filter(p => !["뉴스", "대회"].includes(p.category)).length, 2);
  for (const p of posts) assert.equal(articleSchema.safeParse(p).success, true, p.id);
});
test("short lessons cannot be published, but drafts and samples remain editable", () => {
  const lesson = { ...posts[0], body: "가".repeat(1999) + " ".repeat(100) };
  assert.equal(articleSchema.safeParse(lesson).success, false);
  assert.equal(articleSchema.safeParse({ ...lesson, status: "draft" }).success, true);
  assert.equal(articleSchema.safeParse(seeds[1]).success, true);
});
test("gear requires two distinct real photos, not duplicates or illustrations", () => {
  const gear = posts[1];
  for (const images of [[gear.images[0]], [gear.images[0], gear.images[0]], gear.images.map(i => ({ ...i, kind: "illustration" }))])
    assert.equal(articleSchema.safeParse({ ...gear, images }).success, false);
  assert.equal(articleSchema.safeParse({ ...gear, images: gear.images.map(i => ({ ...i, sourceUrl: "javascript:alert(1)" })) }).success, false);
});
test("news needs sources; tournaments need verified structure and Seoul/Gyeonggi geography", () => {
  assert.equal(articleSchema.safeParse({ ...posts[2], sources: [] }).success, false);
  const event = posts.find(p => p.event?.type === "국내 동호인 대회");
  assert.equal(articleSchema.safeParse({ ...event, event: undefined }).success, false);
  assert.equal(articleSchema.safeParse({ ...event, event: { ...event.event, region: "전국" } }).success, false);
  assert.equal(articleSchema.parse({ ...seeds[4], category: "뉴스 & 대회" }).category, "코트 라이프");
});
