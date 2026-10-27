import { readFile, writeFile, mkdir } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { articleSchema } from "../lib/content.ts";
import { validateEditorialBatch } from "../lib/publication.ts";
import { isDeepStrictEqual } from "node:util";
import { invalidateEditorialCache } from "./editorial-cache.mjs";

// Load exactly one explicit environment. Never silently fall back to production.
const [command, environment, filename, ...flags] = process.argv.slice(2);
if (!["snapshot", "validate", "publish"].includes(command) || !["production", "preview"].includes(environment) || flags.some(flag => !["--apply", "--maintenance"].includes(flag)))
  throw new Error("Usage: node scripts/editorial-publish.mjs snapshot|validate|publish production|preview file.json [--maintenance] [--apply]");
const maintenance = flags.includes("--maintenance");
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
  const batch = validateEditorialBatch(JSON.parse(await readFile(filename, "utf8")), maintenance);
  const ids = batch.map(entry => entry.article.id);
  console.log(`Validated ${batch.length} articles.`);
  if (command === "publish" && flags.includes("--apply")) {
    const before = await sql`select id, data, md5(data::text) as hash from articles where id = any(${ids}::text[])`;
    for (const entry of batch) {
      const old = before.find(r => r.id === entry.article.id);
      if (entry.expectedHash === null && old) throw new Error(`Already exists: ${entry.article.id}; refresh snapshot`);
      if (entry.expectedHash !== null && (!old || old.hash !== entry.expectedHash || old.data.managedBy !== "daily-editor" || old.data.sample))
        throw new Error(`Owner-edited or stale article: ${entry.article.id}; not overwritten`);
    }
    await writeFile(`output/editorial/backup-${environment}-${Date.now()}.json`, JSON.stringify(before, null, 2));
    const result = await sql.transaction(batch.map(({ article, expectedHash }) => expectedHash === null
      ? sql`insert into articles (id, data) values (${article.id}, ${JSON.stringify(article)}::jsonb) on conflict do nothing returning id`
      : sql`update articles set data=${JSON.stringify(article)}::jsonb where id=${article.id} and md5(data::text)=${expectedHash} and data->>'managedBy'='daily-editor' and coalesce(data->>'sample','false') <> 'true' returning id`));
    const written = result.flat().map(r => r.id);
    console.log(JSON.stringify({ environment, written, skipped: batch.filter(e => !written.includes(e.article.id)).map(e => e.article.id) }));
    if (written.length) {
      try {
        const verify = await sql`select id, data from articles where id = any(${written}::text[])`;
        const parsed = articleSchema.array().safeParse(verify.map(row => row.data));
        if (!parsed.success || verify.length !== written.length || parsed.data.some(article =>
          !isDeepStrictEqual(article, batch.find(entry => entry.article.id === article.id)?.article)))
          throw new Error("Post-publication verification failed");
        console.log("Publication verified in database.");
      } finally {
        // Commits must be visible even after a partial conflict or failed readback.
        try {
          await invalidateEditorialCache(environment,env);
          console.log("Public cache invalidated.");
        } catch (error) {
          console.warn(`Database writes completed; cache invalidation failed (${error.message}). Public data will refresh on requests after the 15-minute cache interval. Do not republish this batch.`);
        }
      }
    }
    if (written.length !== batch.length) throw new Error("Concurrent edit detected. Successful writes listed above; refresh snapshot and retry only skipped items.");
  } else if (command === "publish") console.log("Dry run only. Add --apply to publish.");
}
