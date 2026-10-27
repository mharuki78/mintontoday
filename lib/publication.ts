import { isDeepStrictEqual } from "node:util";
import { articleSchema, type Article } from "./content.ts";

export function isPublicArticle(post: Pick<Article, "status" | "sample">) {
  return post.status === "published" && !post.sample;
}

/** Write-only checks: legacy records must remain readable and editable. */
export function publicationIssues(post: Article): string[] {
  if (!isPublicArticle(post)) return [];
  return post.images?.some(image => image.generated && image.kind === "photo")
    ? ["AI 생성 이미지는 실제 사진으로 발행할 수 없습니다. 일러스트로 표시해 주세요."]
    : [];
}

export function prepareManualArticle(post: Article, previous: Article | null, now = new Date().toISOString()): Article {
  const publicFields = ({ managedBy: _owner, updatedAt: _updated, ...content }: Article) => content;
  const unchanged = previous && isDeepStrictEqual(publicFields(post), publicFields(previous));
  return { ...post, managedBy: undefined, updatedAt: unchanged ? previous.updatedAt : now };
}

export type EditorialEntry = { article: Article; expectedHash: string | null };

export function validateEditorialBatch(input: unknown, maintenance = false): EditorialEntry[] {
  if (!Array.isArray(input) || !input.length)
    throw new Error("Expected a nonempty array of { article, expectedHash } entries");
  const ids = new Set<string>();
  return input.map(entry => {
    const article = articleSchema.parse(entry?.article);
    if (ids.has(article.id)) throw new Error("Duplicate article id in batch");
    ids.add(article.id);
    if (article.managedBy !== "daily-editor" || article.sample)
      throw new Error("Editorial batches require non-sample, daily-editor articles");
    if (!maintenance && article.status !== "published")
      throw new Error("Daily batches require published articles");
    if ((maintenance || entry.expectedHash !== null) && !/^[a-f0-9]{32}$/.test(entry.expectedHash || ""))
      throw new Error("A snapshot hash is required for maintenance and updates; only new publications may use null");
    const issues = publicationIssues(article);
    if (issues.length) throw new Error(`${article.id}: ${issues.join(" ")}`);
    return { article, expectedHash: entry.expectedHash };
  });
}
