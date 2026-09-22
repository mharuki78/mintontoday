import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
test("public pages, search and unknown article", async () => {
  for (const route of [
    "/",
    "/articles",
    "/about",
    "/contact",
    "/privacy",
    "/editorial",
    "/admin",
    "/robots.txt",
    "/sitemap.xml",
    "/ads.txt",
  ])
    assert.equal((await fetch(base + route)).status, 200, route);
  assert.equal((await fetch(base + "/articles/missing-post")).status, 404);
  const search = await (
    await fetch(base + "/articles?q=does-not-exist-73921")
  ).text();
  assert.ok(search.includes("아직 이 이야기는 없어요."));
  const sampleResponse = await fetch(base + "/articles/first-racket");
  const article = await sampleResponse.text();
  assert.ok(article.includes("noindex"));
  if (process.env.EXPECT_EDITORIAL === "1") assert.equal(sampleResponse.status, 404, "published editorial content hides seed articles");
  else {
    assert.equal(sampleResponse.status, 200);
    assert.ok(article.includes("예시 원고"));
  }
  const sitemap = await (await fetch(base + "/sitemap.xml")).text();
  assert.ok(!sitemap.includes("first-racket"));
});
test("reject unauthenticated and cross-origin writes", async () => {
  const response = await fetch(base + "/api/admin/posts", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 401);
  const cross = await fetch(base + "/api/admin/login", {
    method: "POST",
    headers: {
      Origin: "https://other.invalid",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(cross.status, 403);
  const wrong = await fetch(base + "/api/admin/login", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ password: "wrong" }),
  });
  assert.equal(wrong.status, 401);
});
test(
  "owner can draft, persist and republish a seed article",
  { skip: process.env.RUN_ADMIN_TESTS !== "1" },
  async () => {
    const env = await readFile(".env.local", "utf8");
    const password = env.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1].trim();
    assert.ok(password);
    const login = await fetch(base + "/api/admin/login", {
      method: "POST",
      headers: { Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
    const headers = {
      Origin: base,
      Cookie: cookie,
      "Content-Type": "application/json",
    };
    assert.equal(
      (
        await fetch(base + "/api/admin/posts", {
          method: "POST",
          headers,
          body: "{}",
        })
      ).status,
      400,
    );
    const { seeds } = await import("../lib/content.ts");
    const db = process.env.DATABASE_URL
      ? (await import("@neondatabase/serverless")).neon(
          process.env.DATABASE_URL,
        )
      : null;
    let existing = seeds;
    if (db)
      existing = (await db`select data from articles`).map((row) => row.data);
    else
      try {
        existing = JSON.parse(await readFile("data/posts.json", "utf8"));
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
    const original = existing.find((p) => p.id === "first-racket");
    assert.ok(original);
    try {
      const draft = await fetch(base + "/api/admin/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...original, status: "draft" }),
      });
      assert.equal(draft.status, 200);
      assert.equal((await fetch(base + "/articles/first-racket")).status, 404);
      const stored = db
        ? (await db`select data from articles`).map((row) => row.data)
        : JSON.parse(await readFile("data/posts.json", "utf8"));
      assert.equal(stored.find((p) => p.id === original.id).status, "draft");
    } finally {
      assert.equal(
        (
          await fetch(base + "/api/admin/posts", {
            method: "POST",
            headers,
            body: JSON.stringify(original),
          })
        ).status,
        200,
      );
    }
    assert.equal((await fetch(base + "/articles/first-racket")).status, 200);
    const logout = await fetch(base + "/api/admin/login", {
      method: "DELETE",
      headers,
    });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
  },
);
