import { readFile, writeFile, mkdir } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { articleSchema } from "../lib/content.ts";
import { createHmac } from "node:crypto";

// Load exactly one explicit environment. Never silently fall back to production.
const [command, environment, filename, flag] = process.argv.slice(2);
if (!["snapshot", "validate", "publish"].includes(command) || !["production", "preview"].includes(environment))
  throw new Error("Usage: node scripts/editorial-publish.mjs snapshot|validate|publish production|preview file.json [--apply]");
const { parseEnv } = await import("node:util");
const env = parseEnv(await readFile(`.env.${environment}.local`, "utf8"));
if (!env.DATABASE_URL) throw new Error("Missing database configuration");
const sql = neon(env.DATABASE_URL);
await mkdir("output/editorial", { recursive: true });
if (command === "snapshot") {
  const rows = await sql`select id, data, md5(data::text) as hash from articles order by id`;
  await writeFile(filename || `output/editorial/${environment}-snapshot.json`, JSON.stringify(rows, null, 2));
  console.log(`Saved ${rows.length} articles (${environment}); credentials excluded.`);
} else {
  const batch = JSON.parse(await readFile(filename, "utf8"));
  if (!Array.isArray(batch) || !batch.length) throw new Error("Expected a nonempty array of { article, expectedHash } entries");
  const ids = new Set();
  for (const entry of batch) {
    entry.article = articleSchema.parse(entry.article);
    if (ids.has(entry.article.id)) throw new Error("Duplicate article id in batch");
    ids.add(entry.article.id);
    if (entry.article.managedBy !== "daily-editor" || entry.article.sample || entry.article.status !== "published")
      throw new Error("Daily batches require published, non-sample, daily-editor articles");
    if (entry.expectedHash !== null && !/^[a-f0-9]{32}$/.test(entry.expectedHash || ""))
      throw new Error("expectedHash must be null for a new post or the snapshot hash for an update");
  }
  console.log(`Validated ${batch.length} articles.`);
  if (command === "publish" && flag === "--apply") {
    const before = await sql`select id, data, md5(data::text) as hash from articles where id = any(${[...ids]}::text[])`;
    for (const entry of batch) {
      const old = before.find(r => r.id === entry.article.id);
      if (entry.expectedHash === null && old) throw new Error(`Already exists: ${entry.article.id}; refresh snapshot`);
      if (entry.expectedHash !== null && (!old || old.hash !== entry.expectedHash || old.data.managedBy !== "daily-editor"))
        throw new Error(`Owner-edited or stale article: ${entry.article.id}; not overwritten`);
    }
    await writeFile(`output/editorial/backup-${environment}-${Date.now()}.json`, JSON.stringify(before, null, 2));
    const result = await sql.transaction(batch.map(({ article, expectedHash }) => expectedHash === null
      ? sql`insert into articles (id, data) values (${article.id}, ${JSON.stringify(article)}::jsonb) on conflict do nothing returning id`
      : sql`update articles set data=${JSON.stringify(article)}::jsonb where id=${article.id} and md5(data::text)=${expectedHash} and data->>'managedBy'='daily-editor' returning id`));
    const written = result.flat().map(r => r.id);
    console.log(JSON.stringify({ environment, written, skipped: batch.filter(e => !written.includes(e.article.id)).map(e => e.article.id) }));
    if (written.length !== batch.length) throw new Error("Concurrent edit detected. Successful writes listed above; refresh snapshot and retry only skipped items.");
    const verify = await sql`select id, data from articles where id = any(${written}::text[])`;
    articleSchema.array().parse(verify.map(r => r.data));
    if (verify.length !== batch.length) throw new Error("Post-publication verification failed");
    console.log("Publication verified in database.");
    // Only signed invalidation crosses HTTP; the session secret stays local.
    try {
      if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET missing");
      if (environment === "preview" && !env.SITE_URL) throw new Error("Preview SITE_URL missing");
      const origin = new URL(env.SITE_URL || "https://mintontoday.com");
      if (origin.protocol !== "https:") throw new Error("SITE_URL must use HTTPS");
      const time = String(Date.now());
      const signature = createHmac("sha256",env.SESSION_SECRET).update(time).digest("hex");
      const response = await fetch(new URL("/api/editorial/revalidate",origin),{method:"POST",
        redirect:"error", signal:AbortSignal.timeout(15000),
        headers:{"X-Editorial-Time":time,"X-Editorial-Signature":signature}});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log("Public cache invalidated.");
    } catch (error) {
      console.warn(`Published successfully; cache invalidation failed (${error.message}). Public data will refresh on requests after the 15-minute cache interval. Do not republish this batch.`);
    }
  } else if (command === "publish") console.log("Dry run only. Add --apply to publish.");
}
