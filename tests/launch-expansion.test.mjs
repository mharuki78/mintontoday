import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { articleSchema, upcomingAmateur, koreaDate } from "../lib/content.ts";

const initial = JSON.parse(await readFile(new URL("../content/2026-09-22.json", import.meta.url), "utf8"));
const expansion = JSON.parse(await readFile(new URL("../content/launch-2026-09-22.json", import.meta.url), "utf8"));
const posts = [...new Map([...initial, ...expansion].map(e => [e.article.id, e.article])).values()];

test("launch inventory has five original articles per editorial category and all verified future events", () => {
  assert.equal(new Set(expansion.map(e => e.article.id)).size, expansion.length);
  for (const p of posts) assert.equal(articleSchema.safeParse(p).success, true, p.id);
  for (const category of ["레슨 & 가이드", "장비 이야기", "코트 라이프", "뉴스"])
    assert.equal(posts.filter(p => p.category === category).length, 5, category);
  assert.equal(posts.filter(p => p.event?.type === "국가대표 대회").length, 5);
  const amateur = posts.filter(p => p.event?.type === "국내 동호인 대회");
  assert.equal(amateur.length, 33);
  assert.ok(amateur.every(p => upcomingAmateur(p, "2026-09-22")));
  assert.ok(amateur.every(p => p.images?.some(i => i.kind === "poster")));
});

test("launch series dates never replace real publication dates", () => {
  for (const category of ["레슨 & 가이드", "장비 이야기", "코트 라이프"]) {
    const selected = posts.filter(p => p.category === category);
    assert.deepEqual(selected.map(p => p.seriesDate).sort(), [17,18,19,20,21].map(d => `2026-09-${d}`));
    assert.ok(selected.every(p => p.date === "2026-09-22"));
  }
  assert.ok(posts.filter(p => p.category === "뉴스").every(p => p.newsDate && p.newsDate <= p.date));
});

test("future tournament filter uses Korea's date boundary and removes cancelled, ended, undated events", () => {
  assert.equal(koreaDate(new Date("2026-09-22T14:59:59Z")), "2026-09-22");
  assert.equal(koreaDate(new Date("2026-09-22T15:00:00Z")), "2026-09-23");
  const p = posts.find(p => p.id === "amateur-2026-571");
  assert.equal(p.event.startDate, "2026-10-11");
  assert.equal(p.event.region, "경기");
  assert.equal(upcomingAmateur(p, "2026-10-11"), true);
  assert.equal(upcomingAmateur(p, "2026-10-12"), false);
  for (const status of ["취소", "종료"])
    assert.equal(upcomingAmateur({ ...p, event: { ...p.event, status } }, "2026-09-22"), false);
  assert.equal(upcomingAmateur({ ...p, event: { ...p.event, startDate: undefined } }, "2026-09-22"), false);
  assert.equal(posts.find(p => p.id === "amateur-2026-559").event.region, "서울");
});
