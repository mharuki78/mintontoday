import { test } from "node:test";
import assert from "node:assert/strict";
import { seeds } from "../lib/content.ts";
import { articleHashtags, normalizeHashtag, parseHashtagInput } from "../lib/hashtags.ts";

test("every editorial category gets a small, unique and relevant hashtag set", () => {
  for (const post of seeds) {
    const tags = articleHashtags(post);
    assert.ok(tags.length >= 3 && tags.length <= 6, `${post.id}: ${tags.join(", ")}`);
    assert.equal(new Set(tags).size, tags.length, post.id);
    assert.ok(tags.every((tag) => /^[\p{L}\p{N}_-]+$/u.test(tag)), post.id);
  }
  assert.ok(articleHashtags(seeds[0]).includes("배드민턴라켓"));
  assert.ok(articleHashtags(seeds[1]).includes("배드민턴준비자세"));
});

test("editor tags are normalized, deduplicated, and incorporated in topic links", () => {
  const tags = articleHashtags({ ...seeds[0], tags: ["#Yonex", "yonex", "잘못된 태그!"] });
  assert.equal(tags[0], "Yonex");
  assert.equal(tags.filter((tag) => tag.toLocaleLowerCase() === "yonex").length, 1);
  assert.equal(normalizeHashtag(" #서울 배드민턴 "), "서울배드민턴");
  assert.equal(normalizeHashtag("검색/오류"), "");
  assert.deepEqual(parseHashtagInput("#풋워크, #풋워크\n#실력 향상"), ["풋워크", "실력향상"]);
});

test("detail and lightweight database projections derive the same tags without incidental body terms", () => {
  const post = { ...seeds[2], title: "운동 모임의 사진 촬영 동의", excerpt: "동호회에서 서로의 촬영 의사를 묻고 사진 공유 범위를 정하는 방법입니다.", body: "요넥스 아스트록스 라켓 스트링 서브 풋워크", tags: ["#촬영동의", "Yonex"] };
  const { body, ...projection } = post;
  const expected = ["촬영동의", "Yonex", "배드민턴동호회", "코트매너", "배드민턴상식", "배드민턴영상"];
  assert.deepEqual(articleHashtags(post), expected);
  assert.deepEqual(articleHashtags(projection), expected);
});
