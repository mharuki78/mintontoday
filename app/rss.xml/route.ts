import { publishedArticles } from "@/lib/store";
import { siteUrl } from "@/lib/site-url";
export const dynamic = "force-dynamic";
const xml = (value: string) => value.replace(/[<>&"']/g, char => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"})[char]!);
export async function GET() {
  const base = siteUrl();
  const posts = (await publishedArticles()).filter(post=>!post.sample).slice(0,30);
  const items = posts.map(post=>{
    const url = `${base}/articles/${post.id}`;
    return `<item><title>${xml(post.title)}</title><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><category>${xml(post.category)}</category><description>${xml(post.body)}</description><pubDate>${new Date(post.date+"T00:00:00+09:00").toUTCString()}</pubDate></item>`;
  }).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Minton Today · 민턴투데이</title><link>${xml(base)}</link><description>배드민턴 뉴스와 레슨, 장비 이야기, 동호회 생활과 대회 일정</description><language>ko</language><atom:link href="${xml(base)}/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`,{headers:{"Content-Type":"application/rss+xml; charset=utf-8","Cache-Control":"public, max-age=300, s-maxage=300"}});
}
