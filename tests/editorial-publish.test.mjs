import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { seeds } from "../lib/content.ts";

const hash = "a".repeat(32);
const original = { ...seeds[2], sample: false, managedBy: "daily-editor" };
const harness = `
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
const fixture = JSON.parse(readFileSync(0,'utf8'));
const events = [];
const state = new Map(fixture.before.map(row => [row.id,structuredClone(row)]));
globalThis.publisherFixture = { events, async readFile(name) { return name.endsWith('fixture.json') ? JSON.stringify(fixture.batch) : 'DATABASE_URL=postgres://test.invalid/isolated'; }, async writeFile(name,value) { events.push('backup'); }, async mkdir() {}, async invalidate() { events.push('invalidate'); } };
const sql = (strings,...values) => {
  const text = strings.join('?');
  if (text.includes('md5(data::text) as hash')) return [...state.values()];
  if (text.startsWith('select id, data')) {
    events.push('verify');
    return values[0].map(id => { const row = structuredClone(state.get(id)); if(fixture.corruptVerify) row.data.title = '검증 중 관측한 다른 제목'; return row; });
  }
  return { text, values };
};
sql.transaction = async queries => queries.map(query => {
  const id = query.text.startsWith('insert') ? query.values[0] : query.values[1];
  const old = state.get(id);
  if (fixture.skipIds?.includes(id)) { events.push('skip:'+id); return []; }
  if (!query.text.startsWith('insert')) {
    if (!query.text.includes("data->>'managedBy'='daily-editor'") || !query.text.includes("data->>'sample'")) throw Error('Missing guarded SQL ownership/sample protection');
    if (!old || old.hash !== query.values[2] || old.data.managedBy !== 'daily-editor' || old.data.sample) return [];
  }
  const data = JSON.parse(query.text.startsWith('insert') ? query.values[1] : query.values[0]);
  state.set(id,{id,data,hash:'b'.repeat(32)});
  events.push('write:'+id);
  return [{id}];
});
globalThis.publisherFixture.sql = sql;
const moduleUrl = source => 'data:text/javascript,'+encodeURIComponent(source);
registerHooks({ resolve(specifier,context,next) {
  if (context.parentURL?.endsWith('/scripts/editorial-publish.mjs') && specifier==='node:fs/promises') return {url:moduleUrl('export const {readFile,writeFile,mkdir}=globalThis.publisherFixture;'),shortCircuit:true};
  if (specifier==='@neondatabase/serverless') return {url:moduleUrl('export const neon=()=>globalThis.publisherFixture.sql;'),shortCircuit:true};
  if (context.parentURL?.endsWith('/scripts/editorial-publish.mjs') && specifier==='./editorial-cache.mjs') return {url:moduleUrl('export const invalidateEditorialCache=globalThis.publisherFixture.invalidate;'),shortCircuit:true};
  return next(specifier,context);
} });
process.argv=[process.execPath,'scripts/editorial-publish.mjs',fixture.command||'publish','production','fixture.json',...fixture.flags];
let error=null;
try { await import('./scripts/editorial-publish.mjs'); } catch(failure) { error=failure.message; }
console.log('PUBLISH_RESULT:'+JSON.stringify({events,error,state:[...state.values()]}));
`;

function run(fixture) {
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", harness], { cwd: new URL("../", import.meta.url), input: JSON.stringify(fixture), encoding: "utf8" });
  assert.equal(child.status, 0, child.stderr);
  const line = child.stdout.split(/\r?\n/).find(value => value.startsWith("PUBLISH_RESULT:"));
  assert.ok(line, child.stderr || child.stdout);
  return { ...JSON.parse(line.slice("PUBLISH_RESULT:".length)), output: child.stdout };
}
const before = article => ({ id: article.id, data: article, hash });

test("maintenance withdraws only an existing non-sample daily-editor record and verifies before invalidation", () => {
  const article = { ...original, status: "draft" };
  const result = run({ before: [before(original)], batch: [{ article, expectedHash: hash }], flags: ["--maintenance", "--apply"] });
  assert.equal(result.error, null);
  assert.equal(result.state[0].data.status, "draft");
  assert.deepEqual(result.events, ["backup", "write:first-club-day", "verify", "invalidate"]);
  for (const protectedArticle of [{ ...original, sample: true }, { ...original, managedBy: undefined }]) {
    const rejected = run({ before: [before(protectedArticle)], batch: [{ article, expectedHash: hash }], flags: ["--maintenance", "--apply"] });
    assert.match(rejected.error, /Owner-edited|protected/i);
    assert.deepEqual(rejected.events, []);
  }
});

test("partial concurrent writes still verify and invalidate successful changes before reporting skips", () => {
  const second = { ...original, id: "second-post" };
  const result = run({ before: [before(original), before(second)], batch: [original, second].map(article => ({ article: { ...article, title: "검토 후 수정한 새 제목" }, expectedHash: hash })), flags: ["--apply", "--maintenance"], skipIds: ["second-post"] });
  assert.match(result.error, /Concurrent edit/);
  assert.equal(result.state.find(row => row.id === original.id).data.title, "검토 후 수정한 새 제목");
  assert.equal(result.state.find(row => row.id === second.id).data.title, original.title);
  assert.deepEqual(result.events, ["backup", "write:first-club-day", "skip:second-post", "verify", "invalidate"]);
  assert.match(result.output, /"skipped":\["second-post"\]/);
});

test("readback mismatch reports failure and still invalidates committed content", () => {
  const result = run({ before: [before(original)], batch: [{ article: original, expectedHash: hash }], flags: ["--apply"], corruptVerify: true });
  assert.match(result.error, /verification failed/i);
  assert.deepEqual(result.events, ["backup", "write:first-club-day", "verify", "invalidate"]);
});
