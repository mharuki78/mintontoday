import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { richDocumentSchema, legacyDocument, richText } from "../lib/rich-text.ts";
import { articleSchema } from "../lib/content.ts";
import { optimizeUpload } from "../lib/upload-image.ts";
import { readBody, BodyTooLarge } from "../lib/request-body.ts";

const text = "서식을 적용한 본문을 저장하고 다시 읽어도 내용과 출처가 유지되어야 합니다. 배드민턴 동호회 운영자가 작성한 테스트 글입니다.";
const document = { type: "doc", content: [{ type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", text, marks: [{ type: "bold" }, { type: "textStyle", attrs: { fontSize: "24px", color: "#19476a", backgroundColor: "rgb(224, 242, 218)", fontFamily: "serif" } }] }] }] };
const article = { id: "editor-test", title: "편집기 테스트", excerpt: "저장된 서식과 본문을 확인하는 테스트입니다.", body: text, bodyDocument: document, category: "코트 라이프", status: "published", sample: false, date: "2026-09-23", art: "court" };
test("rich text round trip preserves formatting and derives canonical body", () => {
  const parsed = articleSchema.parse({ ...article, body: "다른 본문".repeat(20) });
  assert.deepEqual(parsed.bodyDocument, document);
  assert.equal(parsed.body, text);
  assert.equal(articleSchema.safeParse({ ...article, category: "레슨 & 가이드", body: "가".repeat(2100) }).success, false);
});
test("rejects script links, executable styles, unknown nodes and missing image metadata", () => {
  for (const mark of [
    { type: "link", attrs: { href: "javascript:alert(1)" } },
    { type: "link", attrs: { href: "data:text/html,x" } },
    { type: "textStyle", attrs: { color: "red;background:url(x)" } },
    { type: "textStyle", attrs: { fontSize: "900px" } },
    { type: "textStyle", attrs: { fontFamily: "url(x)" } },
  ]) {
    const bad = structuredClone(document); bad.content[0].content[0].marks = [mark];
    assert.equal(richDocumentSchema.safeParse(bad).success, false);
  }
  assert.equal(richDocumentSchema.safeParse({ type: "doc", content: [{ type: "script", text: "alert(1)" }] }).success, false);
  const photo = { type: "image", attrs: { src: "/images/example.webp" } };
  assert.equal(articleSchema.safeParse({ ...article, bodyDocument: { ...document, content: [...document.content, photo] } }).success, false);
});
test("deep or oversized untrusted documents fail without recursion overflow", () => {
  let nested = { type: "paragraph" };
  for (let i = 0; i < 20000; i++) nested = { type: "blockquote", content: [nested] };
  assert.equal(richDocumentSchema.safeParse({ type: "doc", content: [nested] }).success, false);
  assert.equal(richDocumentSchema.safeParse({ type: "doc", content: Array.from({ length: 4001 }, () => ({ type: "paragraph" })) }).success, false);
});
test("legacy conversion keeps heading text, line breaks and every image", () => {
  const old = legacyDocument("소개 글입니다.\n\n## 소제목\n첫 줄\n둘째 줄", [{ url: "/images/a.webp", alt: "첫 번째 사진" }, { url: "/images/b.webp", alt: "두 번째 사진" }]);
  assert.equal(richDocumentSchema.safeParse(old).success, true);
  assert.equal(old.content.filter(n => n.type === "image").length, 2);
  assert.match(richText(old), /## 소제목\n\n첫 줄\n둘째 줄/);
});
test("uploads become bounded metadata-free WebP and reject invalid formats", async () => {
  const original = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: "#cce5dc" } }).jpeg().withMetadata().toBuffer();
  const result = await optimizeUpload(original);
  const metadata = await sharp(result.data).metadata();
  assert.equal(metadata.format, "webp"); assert.equal(result.width, 1800); assert.equal(result.height, 900);
  assert.equal(metadata.exif, undefined); assert.equal(metadata.icc, undefined);
  assert.ok(result.bytes <= 1_000_000);
  for (const input of [Buffer.alloc(0), Buffer.alloc(4_000_001), Buffer.from("<svg width='100' height='100'></svg>"), Buffer.from("not an image")]) await assert.rejects(optimizeUpload(input));
});
test("body limit also protects requests without content-length", async () => {
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(6)); controller.enqueue(new Uint8Array(6)); controller.close(); } });
  await assert.rejects(readBody(new Request("http://localhost", { method: "POST", body: stream, duplex: "half" }), 10), BodyTooLarge);
});
