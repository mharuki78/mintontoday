import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseEnv } from "node:util";
import { neon } from "@neondatabase/serverless";
import { signSession } from "../lib/admin-crypto.ts";

const mode = process.argv[2];
assert.ok(!mode || mode === "--preview", "Only local or Preview tests are supported");
await mkdir("output", { recursive: true });
const directory = await mkdtemp(path.resolve("output", "editor-test-"));
const preview = mode ? parseEnv(await readFile(".env.preview.local", "utf8")) : null;
const db = preview ? neon(preview.DATABASE_URL) : null;
const id = "editor-test-" + randomUUID();
const base = "http://localhost:3016";
const password = randomUUID(), secret = randomUUID();
const mediaIds = [];
let server, cookie = "";
async function start() {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3016"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, DATABASE_URL: preview?.DATABASE_URL || "", DATABASE_URL_UNPOOLED: "", VERCEL: "", CONTENT_DIR: directory, ADMIN_PASSWORD: password, SESSION_SECRET: secret },
  });
  await new Promise((resolve, reject) => {
    let log = "";
    const timeout = setTimeout(() => reject(new Error("Test server start timed out")), 30000);
    const read = data => { log += data; if (log.includes("Ready in")) { clearTimeout(timeout); resolve(); } };
    server.stdout.on("data", read); server.stderr.on("data", read);
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Test server exited ${code}`)); });
  });
}
async function stop() { if (server && server.exitCode === null) { const done = once(server, "exit"); server.kill(); await done; } }
const upload = (body, type = "image/webp", auth = cookie, origin = base) => fetch(base + "/api/admin/media", { method: "POST", headers: { Origin: origin, Cookie: auth, "Content-Type": type }, body });
const save = article => fetch(base + "/api/admin/posts", { method: "POST", headers: { Origin: base, Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(article) });
const readPosts = async () => db ? (await db`select data from articles where id=${id}`).map(row => row.data) : JSON.parse(await readFile(path.join(directory, "posts.json"), "utf8"));
try {
  await start();
  const version = db ? (await db`select version from admin_credentials where id='owner'`)[0]?.version : null;
  if (version) cookie = "minton_session=" + signSession(version, secret);
  else {
    const login = await fetch(base + "/api/admin/login", { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    assert.equal(login.status, 200); cookie = login.headers.get("set-cookie").split(";")[0];
  }
  const photo = await readFile("public/images/editorial/court-cleanup-20260923.webp");
  assert.equal((await upload(photo, "image/webp", "")).status, 401);
  assert.equal((await upload(photo, "image/webp", cookie, "https://other.invalid")).status, 403);
  assert.equal((await upload(photo, "image/svg+xml")).status, 415);
  assert.equal((await upload(Buffer.from("<svg></svg>"), "image/png")).status, 400);
  assert.equal((await upload(Buffer.alloc(4_000_001))).status, 413);
  const response = await upload(photo); assert.equal(response.status, 201);
  const media = await response.json(); mediaIds.push(media.id);
  assert.equal((await fetch(base + media.url)).status, 404);
  const privateImage = await fetch(base + media.url, { headers: { Cookie: cookie } });
  assert.equal(privateImage.status, 200); assert.match(privateImage.headers.get("cache-control"), /no-store/);
  assert.equal(privateImage.headers.get("content-type"), "image/webp");
  const body = "본문 편집기의 서식을 저장한 뒤 다시 확인하는 테스트입니다. 실제 운영 글에는 영향을 주지 않는 임시 테스트 문장입니다.";
  const article = { id, title: "편집기 통합 테스트", excerpt: "서식과 이미지 저장을 확인하는 테스트 글입니다.", category: "코트 라이프", date: "2026-09-23", status: "draft", sample: false, art: "court", body,
    managedBy: "daily-editor",
    bodyDocument: { type: "doc", content: [
      { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", text: body, marks: [{ type: "bold" }, { type: "textStyle", attrs: { fontSize: "24px", color: "#19476a", fontFamily: "serif" } }] }] },
      { type: "image", attrs: { src: media.url, alt: "코트 정리 테스트 사진", width: "50%" } },
    ] }, images: [{ url: media.url, alt: "코트 정리 테스트 사진", caption: "테스트용 AI 이미지", credit: "Minton Today", sourceUrl: "https://mintontoday.com" + media.url, rights: "직접 생성한 테스트 이미지", generated: true, kind: "illustration" }],
  };
  const draft = await save(article); assert.equal(draft.status, 200, await draft.clone().text());
  const saved = (await draft.json()).article;
  assert.equal(saved.managedBy, undefined); assert.equal(saved.body, body);
  assert.equal((await fetch(base + "/articles/" + id)).status, 404);
  assert.equal((await fetch(base + media.url)).status, 404);
  assert.equal((await save({ ...saved, status: "published" })).status, 200);
  const rendered = await fetch(base + "/articles/" + id); assert.equal(rendered.status, 200);
  const html = await rendered.text(); assert.match(html, /font-size:24px/); assert.match(html, /color:#19476a/); assert.ok(html.includes(media.url));
  const publicImage = await fetch(base + media.url); assert.equal(publicImage.status, 200); assert.match(publicImage.headers.get("cache-control"), /public/);
  await stop(); await start();
  const stored = (await readPosts()).find(post => post.id === id);
  assert.deepEqual(stored.bodyDocument, article.bodyDocument);
  assert.equal((await fetch(base + media.url)).status, 200);
  assert.equal((await save({ ...saved, status: "draft" })).status, 200);
  assert.equal((await fetch(base + media.url)).status, 404);
  console.log(`Rich editor API passed (${preview ? "Preview database" : "isolated local"}): auth, bounded upload, draft privacy, publication, React formatting, restart persistence, unpublication.`);
} finally {
  await stop();
  if (db) {
    await db`delete from articles where id=${id}`;
    for (const mediaId of mediaIds) await db`delete from media where id=${mediaId}`;
    console.log("Only uniquely identified test rows removed from Preview.");
  }
}
