import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHmac } from "node:crypto";
import { pathToFileURL } from "node:url";

export async function invalidateEditorialCache(environment, env) {
  if (!["production","preview"].includes(environment)) throw new Error("Explicit production or preview environment required");
  let settings = {};
  try {settings = parseEnv(await readFile(`.env.editorial.${environment}.local`,"utf8"));}
  catch(error) {if(error.code !== "ENOENT") throw error;}
  // Separate file survives Vercel env pull, which omits sensitive variables.
  const secret = env.EDITORIAL_CACHE_SECRET || settings.EDITORIAL_CACHE_SECRET;
  if(!secret || secret.length < 32) throw new Error("Editorial cache signing key missing");
  const site = env.SITE_URL || settings.SITE_URL;
  if(environment === "preview" && !site) throw new Error("Preview SITE_URL missing");
  const origin = new URL(site || "https://mintontoday.com");
  if(origin.protocol !== "https:") throw new Error("SITE_URL must use HTTPS");
  const time = String(Date.now());
  const signature = createHmac("sha256",secret).update(time).digest("hex");
  const response = await fetch(new URL("/api/editorial/revalidate",origin),{method:"POST",redirect:"error",
    signal:AbortSignal.timeout(15000),headers:{"X-Editorial-Time":time,"X-Editorial-Signature":signature}});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
}

if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const environment = process.argv[2];
  if(!["production","preview"].includes(environment)) throw new Error("Usage: node scripts/editorial-cache.mjs production|preview");
  const env = parseEnv(await readFile(`.env.${environment}.local`,"utf8"));
  await invalidateEditorialCache(environment,env);
  console.log(`Public cache invalidated (${environment}); no articles changed.`);
}
