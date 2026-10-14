import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { articles } from "@/db/schema";
import { getDatabase } from "./database";
import { publishedArticles } from "./store";
import { articleSchema, categories, tournamentTypes, upcomingAmateur, readingTime, type Article } from "./content";
import type { ArticlePreview } from "./article-preview";

export const PUBLIC_ARTICLES_TAG = "public-articles";
const scope = createHash("sha256").update(process.env.DATABASE_URL || process.env.CONTENT_DIR || "local").digest("hex").slice(0, 20);
const options = { tags: [PUBLIC_ARTICLES_TAG], revalidate: 900 };
const published = sql`data->>'status' = 'published' and
  (coalesce(data->>'sample', 'false') <> 'true' or not exists
    (select 1 from articles editorial where editorial.data->>'status' = 'published'
      and coalesce(editorial.data->>'sample', 'false') <> 'true'))`;
const editorial = sql`data->>'status' = 'published' and coalesce(data->>'sample', 'false') <> 'true'`;
const newest = sql`data->>'date' desc, coalesce(data->>'newsDate', data->>'seriesDate', data->>'date') desc, id asc`;
const previewSchema = z.object({
  id: z.string(), title: z.string(), category: z.enum(categories), excerpt: z.string(),
  art: z.enum(["court", "racket", "shuttle", "bag", "footwork", "score"]), date: z.string(),
  seriesDate: z.string().optional(), sample: z.boolean(), readingMinutes: z.number(),
  images: z.array(z.object({url:z.string(), alt:z.string(), generated:z.boolean().optional()})).optional(),
  event: z.object({type:z.enum(tournamentTypes), region:z.enum(["해외", "전국", "서울", "경기"]),
    startDate:z.string().optional(), endDate:z.string().optional(), status:z.enum(["예정", "접수 중", "진행 중", "종료", "취소", "확인 중"])}).optional(),
});
// Projection happens inside Postgres: discarded JSON must not cross the network.
const preview = sql`jsonb_strip_nulls(jsonb_build_object(
  'id', id, 'title', data->'title', 'category', data->'category', 'excerpt', data->'excerpt',
  'art', data->'art', 'date', data->'date', 'seriesDate', data->'seriesDate',
  'sample', coalesce(data->'sample', 'false'::jsonb),
  'readingMinutes', greatest(2, ceil(char_length(data->>'body') / 600.0)),
  'images', case when jsonb_array_length(coalesce(data->'images', '[]'::jsonb)) > 0 then
    jsonb_build_array(jsonb_build_object('url', data->'images'->0->'url',
      'alt', data->'images'->0->'alt', 'generated', data->'images'->0->'generated')) end,
  'event', case when data->'event' is not null then jsonb_build_object(
    'type', data->'event'->'type', 'region', data->'event'->'region',
    'startDate', data->'event'->'startDate', 'endDate', data->'event'->'endDate', 'status', data->'event'->'status') end))`;

type PageInput = {category?: Article["category"]; type?: typeof tournamentTypes[number]; region?: string;
  q?: string; page?: number; limit?: number; excludeId?: string; today: string};
function card(post: Article): ArticlePreview {
  return {id:post.id, title:post.title, category:post.category, excerpt:post.excerpt, art:post.art,
    date:post.date, seriesDate:post.seriesDate, sample:post.sample, readingMinutes:readingTime(post.body),
    images:post.images?.slice(0,1).map(({url,alt,generated})=>({url,alt,generated})),
    event:post.event && {type:post.event.type, region:post.event.region, startDate:post.event.startDate,
      endDate:post.event.endDate, status:post.event.status}};
}
export function getArticlePage(input: PageInput) {
  return cachedPage({...input, q:(input.q || "").trim().slice(0,200),
    page:Math.max(1, Math.min(100000, Math.floor(input.page || 1))),
    limit:Math.max(1, Math.min(24, Math.floor(input.limit || 24)))});
}
const cachedPage = unstable_cache(async (input: PageInput) => {
  const db = getDatabase();
  const {category,type,region,q,excludeId,today} = input;
  const limit = input.limit!;
  const page = input.page!;
  if (!db) {
    const posts = (await publishedArticles()).filter(p =>
      (p.event?.type !== "국내 동호인 대회" || upcomingAmateur(p,today)) &&
      (!category || p.category === category) && (!excludeId || p.id !== excludeId) &&
      (category !== "대회" || ((!type || p.event?.type === type) && (!region || p.event?.region === region))) &&
      (!q || `${p.title} ${p.excerpt} ${p.body}`.toLowerCase().includes(q.toLowerCase())));
    if(category === "대회") posts.sort((a,b)=>(a.event?.startDate || "9999").localeCompare(b.event?.startDate || "9999") || a.title.localeCompare(b.title,"ko"));
    return {posts:posts.slice((page-1)*limit,page*limit).map(card), total:posts.length};
  }
  const conditions: SQL[] = [published, sql`(coalesce(data->'event'->>'type','') <> '국내 동호인 대회' or
    (data->'event'->>'startDate' >= ${today} and data->'event'->>'status' not in ('취소','종료')))`];
  if(category) conditions.push(sql`data->>'category' = ${category}`);
  if(excludeId) conditions.push(sql`id <> ${excludeId}`);
  if(category === "대회" && type) conditions.push(sql`data->'event'->>'type' = ${type}`);
  if(category === "대회" && region) conditions.push(sql`data->'event'->>'region' = ${region}`);
  if(q) {
    const term = `%${q.replace(/[\\%_]/g, char => `\\${char}`)}%`;
    conditions.push(sql`concat_ws(' ', data->>'title', data->>'excerpt', data->>'body') ilike ${term}`);
  }
  const where = sql.join(conditions, sql` and `);
  const order = category === "대회" ? sql`coalesce(data->'event'->>'startDate','9999') asc, data->>'title' asc, id asc` : newest;
  const [count, rows] = await Promise.all([
    db.execute<{total:number}>(sql`select count(*)::int as total from articles where ${where}`),
    db.execute<{preview:unknown}>(sql`select ${preview} as preview from articles where ${where} order by ${order} limit ${limit} offset ${(page-1)*limit}`),
  ]);
  return {posts:rows.rows.map(r => previewSchema.parse(r.preview)), total:count.rows[0].total};
}, ["article-page-v1", scope], options);

// React memoization shares the detail read with generateMetadata in this request.
export const getPublishedArticle = cache(async (id: string) => {
  if(!/^[a-z0-9-]{1,100}$/.test(id)) return null;
  return cachedArticle(id);
});
const cachedArticle = unstable_cache(async (id: string) => {
  const db = getDatabase();
  if(!db) return (await publishedArticles()).find(p => p.id === id) || null;
  const rows = await db.select({data:articles.data}).from(articles).where(sql`${articles.id} = ${id} and ${published}`).limit(1);
  return rows.length ? articleSchema.parse(rows[0].data) : null;
}, ["article-detail-v1", scope], options);

const feedSchema = z.object({id:z.string(),title:z.string(),category:z.enum(categories),body:z.string(),date:z.string()});
const cachedFeedPage = unstable_cache(async (offset: number) => {
  const db = getDatabase();
  if(!db) return (await publishedArticles()).filter(p=>!p.sample).slice(offset,offset+5)
    .map(({id,title,category,body,date})=>({id,title,category,body,date}));
  const rows = await db.execute<{post:unknown}>(sql`select jsonb_build_object(
    'id',id,'title',data->'title','category',data->'category','body',data->'body','date',data->'date') as post
    from articles where ${editorial} order by ${newest} limit 5 offset ${offset}`);
  return rows.rows.map(r=>feedSchema.parse(r.post));
}, ["article-feed-page-v1", scope], options);
export async function getRecentPublishedArticles() {
  // Five maximum-length bodies fit safely below Next's 2 MB cache-entry limit.
  return (await Promise.all([0,5,10,15,20,25].map(cachedFeedPage))).flat();
}

const indexSchema = z.object({id:z.string(), date:z.string(), updatedAt:z.string().optional(), images:z.array(z.object({url:z.string()})).optional()});
export const getPublishedIndex = unstable_cache(async () => {
  const db = getDatabase();
  if(!db) return (await publishedArticles()).filter(p=>!p.sample).map(p=>({id:p.id,date:p.date,updatedAt:p.updatedAt,images:p.images?.map(i=>({url:i.url}))}));
  const result: z.infer<typeof indexSchema>[] = [];
  let after = "";
  // A complete sitemap with bounded responses, even as the catalogue grows.
  while(true) {
    const rows = await db.execute<{entry:unknown}>(sql`select jsonb_strip_nulls(jsonb_build_object(
      'id',id,'date',data->'date','updatedAt',data->'updatedAt','images',
      (select jsonb_agg(jsonb_build_object('url',image->'url')) from jsonb_array_elements(coalesce(data->'images','[]'::jsonb)) image))) as entry
      from articles where ${editorial} and id > ${after} order by id limit 500`);
    const batch = rows.rows.map(r=>indexSchema.parse(r.entry));
    result.push(...batch);
    if(batch.length < 500) break;
    after = batch[batch.length-1].id;
  }
  return result;
}, ["article-index-v1", scope], options);
