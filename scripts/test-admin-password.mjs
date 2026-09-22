import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseEnv } from "node:util";
import { neon } from "@neondatabase/serverless";

const mode = process.argv[2];
assert.ok(!mode || mode === "--preview", "Only isolated local or Preview tests are supported");
await mkdir("output", { recursive: true });
const directory = await mkdtemp(path.resolve("output", "password-test-"));
const preview = mode === "--preview" ? parseEnv(await readFile(".env.preview.local", "utf8")) : null;
const db = preview ? neon(preview.DATABASE_URL) : null;
if (db) assert.equal((await db`select id from admin_credentials`).length, 0, "Preview already has credentials; refusing to change them");
const base = "http://localhost:3015";
const initial = randomUUID();
const first = randomUUID();
const second = randomUUID();
const secret = randomUUID();
const ownedVersions = new Set();
let server;
let log = "";
async function start(bootstrap = initial) {
  log = "";
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3015"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, DATABASE_URL: preview?.DATABASE_URL || "", DATABASE_URL_UNPOOLED: "", VERCEL: "", CONTENT_DIR: directory, ADMIN_PASSWORD: bootstrap, SESSION_SECRET: secret },
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Test server did not start")), 30000);
    const read = data => { log += data; if (log.includes("Ready in")) { clearTimeout(timeout); resolve(); } };
    server.stdout.on("data", read);
    server.stderr.on("data", read);
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Test server exited: ${code}`)); });
  });
}
async function stop() {
  if (server && server.exitCode === null) { const done = once(server, "exit"); server.kill(); await done; }
}
const send = (route, data, cookie = "", origin = base) => fetch(base + route, {
  method: "POST", headers: { Origin: origin, Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(data),
});
function session(response) {
  const header = response.headers.get("set-cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=strict/i);
  assert.match(header, /Secure/i);
  const cookie = header.split(";")[0];
  const version = cookie.split("=")[1].split(".")[1];
  if (/^[a-f0-9-]{36}$/.test(version)) ownedVersions.add(version);
  return cookie;
}
async function login(password) {
  const response = await send("/api/admin/login", { password });
  assert.equal(response.status, 200);
  return session(response);
}
const change = (currentPassword, newPassword, confirmPassword = newPassword) => ({ currentPassword, newPassword, confirmPassword });
try {
  await start();
  assert.equal((await send("/api/admin/password", change(initial, first))).status, 401);
  assert.equal((await send("/api/admin/password", change(initial, first), "", "https://other.invalid")).status, 403);
  assert.equal((await send("/api/admin/password", change(initial, first), "minton_session=forged")).status, 401);
  const oldCookie = await login(initial);
  assert.equal((await send("/api/admin/password", change("wrong", first), oldCookie)).status, 400);
  for (const input of [change(initial, "short"), change(initial, first, "mismatch"), change(initial, initial), change(initial, " ".repeat(8))])
    assert.equal((await send("/api/admin/password", input, oldCookie)).status, 400);
  assert.equal((await send("/api/admin/password", { oversized: "x".repeat(5000) }, oldCookie)).status, 413);
  const changed = await send("/api/admin/password", change(initial, first), oldCookie);
  assert.equal(changed.status, 200);
  assert.deepEqual(await changed.json(), { ok: true });
  const newCookie = session(changed);
  assert.equal((await send("/api/admin/posts", {}, oldCookie)).status, 401);
  assert.equal((await send("/api/admin/posts", {}, newCookie)).status, 400);
  assert.equal((await send("/api/admin/login", { password: initial })).status, 401);
  await login(first);
  const changedAgain = await send("/api/admin/password", change(first, second), newCookie);
  assert.equal(changedAgain.status, 200);
  const latestCookie = session(changedAgain);
  assert.equal((await send("/api/admin/posts", {}, newCookie)).status, 401);
  assert.equal((await send("/api/admin/posts", {}, latestCookie)).status, 400);
  const stored = db ? (await db`select password_hash as "passwordHash", version from admin_credentials where id='owner'`)[0]
    : JSON.parse(await readFile(path.join(directory, "admin-credentials.json"), "utf8"));
  assert.match(stored.passwordHash, /^scrypt:131072:8:1:/);
  assert.ok(!JSON.stringify(stored).includes(second));
  assert.ok(ownedVersions.has(stored.version));
  await stop();
  await start(""); // Stored credentials must survive restarts without the bootstrap password.
  await login(second);
  let limited = false;
  for (let index = 0; index < 11; index++) {
    const response = await send("/api/admin/login", { password: "incorrect" });
    if (response.status === 429) { limited = true; break; }
    assert.equal(response.status, 401);
  }
  assert.equal(limited, true);
  console.log(`Password API integration passed (${preview ? "Preview database" : "isolated local files"}): authorization, validation, rotation, session revocation, persistence, rate limiting.`);
} finally {
  await stop();
  if (db && ownedVersions.size) {
    const result = await db`delete from admin_credentials where id='owner' and version=any(${[...ownedVersions]}::text[]) returning id`;
    assert.equal(result.length, 1, "Only the credential created by this test may be removed");
    console.log("Preview test credential removed; articles untouched.");
  }
}
