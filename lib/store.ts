import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { articleSchema, seeds, type Article } from "./content";
import { getDatabase } from "./database";
import { articles } from "@/db/schema";
const directory = process.env.CONTENT_DIR
  ? path.resolve(/* turbopackIgnore: true */ process.env.CONTENT_DIR)
  : path.join(process.cwd(), "data");
const file = path.join(directory, "posts.json");
let queue = Promise.resolve();
export async function allArticles(): Promise<Article[]> {
  const db = getDatabase();
  if (db)
    return articleSchema
      .array()
      .parse((await db.select().from(articles)).map((row) => row.data));
  try {
    return articleSchema
      .array()
      .parse(JSON.parse(await readFile(file, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return structuredClone(seeds);
    throw error;
  }
}
export async function publishedArticles() {
  const posts = await allArticles();
  const hasEditorial = posts.some(p => p.status === "published" && !p.sample);
  return posts
    .filter((p) => p.status === "published" && (!hasEditorial || !p.sample))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.newsDate || b.seriesDate || b.date).localeCompare(a.newsDate || a.seriesDate || a.date) || a.id.localeCompare(b.id));
}
export async function saveArticle(article: Article) {
  const db = getDatabase();
  if (db) {
    await db
      .insert(articles)
      .values({ id: article.id, data: article })
      .onConflictDoUpdate({ target: articles.id, set: { data: article } });
    return;
  }
  const operation = queue.then(async () => {
    const posts = await allArticles();
    const index = posts.findIndex((p) => p.id === article.id);
    if (index < 0) posts.push(article);
    else posts[index] = article;
    await mkdir(directory, { recursive: true });
    const temp = path.join(directory, `${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(posts, null, 2), "utf8");
    await rename(temp, file);
  });
  queue = operation.catch(() => {});
  await operation;
}
