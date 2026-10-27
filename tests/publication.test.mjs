import { test } from "node:test";
import assert from "node:assert/strict";
import { articleSchema, seeds } from "../lib/content.ts";

const publication = await import("../lib/publication.ts");
const post = { ...seeds[2], sample: false, managedBy: "daily-editor", updatedAt: "2026-09-23T00:00:00.000Z" };
const hash = "a".repeat(32);

test("public eligibility never falls back to samples when editorial articles are withdrawn", () => {
  assert.equal(typeof publication.isPublicArticle, "function", "public eligibility helper is available");
  assert.deepEqual([seeds[0], { ...post, status: "draft" }].filter(publication.isPublicArticle), []);
  assert.deepEqual([seeds[0], post].filter(publication.isPublicArticle).map(p => p.id), [post.id]);
});

test("generated real-photo claims block publication without making stored articles unreadable", () => {
  assert.equal(typeof publication.publicationIssues, "function", "write-only publication validation is available");
  const image = { url: "https://example.com/image.webp", alt: "테스트 사진", caption: "AI 일러스트", credit: "Minton Today", sourceUrl: "https://example.com", rights: "직접 생성", kind: "photo", generated: true };
  const legacy = { ...post, images: [image] };
  assert.equal(articleSchema.safeParse(legacy).success, true, "stored legacy metadata remains readable");
  assert.equal(publication.publicationIssues(legacy).length, 1);
  assert.deepEqual(publication.publicationIssues({ ...legacy, status: "draft" }), []);
  assert.deepEqual(publication.publicationIssues({ ...legacy, images: [{ ...image, kind: "illustration" }] }), []);
});

test("unchanged manual saves preserve freshness while transferring ownership", () => {
  assert.equal(typeof publication.prepareManualArticle, "function", "manual-save comparison is available");
  const now = "2026-10-27T01:00:00.000Z";
  const unchanged = publication.prepareManualArticle({ ...post, updatedAt: now }, post, now);
  assert.equal(unchanged.updatedAt, post.updatedAt);
  assert.equal(unchanged.managedBy, undefined);
  assert.equal(publication.prepareManualArticle({ ...post, title: "실제 수정한 글 제목" }, post, now).updatedAt, now);
  assert.equal(publication.prepareManualArticle({ ...post, status: "draft" }, post, now).updatedAt, now);
  assert.equal(publication.prepareManualArticle(post, null, now).updatedAt, now);
  assert.equal(publication.prepareManualArticle(post, { ...post, updatedAt: undefined }, now).updatedAt, undefined);
});

test("maintenance withdrawals require existing hashes and cannot create drafts or claim manual ownership", () => {
  assert.equal(typeof publication.validateEditorialBatch, "function", "guarded maintenance validation is available");
  const entry = { article: { ...post, status: "draft" }, expectedHash: hash };
  assert.throws(() => publication.validateEditorialBatch([entry]), /published/);
  assert.equal(publication.validateEditorialBatch([entry], true)[0].article.status, "draft");
  assert.throws(() => publication.validateEditorialBatch([{ ...entry, expectedHash: null }], true), /hash/i);
  assert.throws(() => publication.validateEditorialBatch([{ ...entry, article: { ...entry.article, sample: true } }], true), /non-sample/);
  assert.throws(() => publication.validateEditorialBatch([{ ...entry, article: { ...entry.article, managedBy: undefined } }], true), /daily-editor/);
  assert.throws(() => publication.validateEditorialBatch([entry, entry], true), /Duplicate/);
  assert.equal(publication.validateEditorialBatch([{ article: post, expectedHash: null }])[0].expectedHash, null);
});
