import { siteUrl } from "@/lib/site-url";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header, Footer, Art, ArticleCard } from "@/components/site";
import ArticleTools from "@/components/article-tools";
import { ArticleContent } from "@/components/article-content";
import { ServicePractice } from "@/components/service-practice";
import { richText, type RichNode } from "@/lib/rich-text";
import { getPublishedArticle, getArticlePage } from "@/lib/public-content";
import { readingTime, koreaDate } from "@/lib/content";
import { connection } from "next/server";
import { articleHashtags } from "@/lib/hashtags";
import { articleStructuredData, serializeStructuredData } from "@/lib/structured-data";
import { ArrowLeft, ArrowUpRight, List } from "lucide-react";

function documentHeadings(node: RichNode): string[] {
  if (node.type === "heading") return [(node.content || []).map(richText).join("")];
  return (node.content || []).flatMap(documentHeadings);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();
  const post = await getPublishedArticle(slug);
  return post
    ? {
        title: post.title,
        description: post.excerpt,
        keywords: articleHashtags(post),
        alternates: { canonical: `/articles/${post.id}` },
        robots: post.sample ? { index: false, follow: true } : undefined,
        openGraph: {
          type: "article",
          title: post.title,
          description: post.excerpt,
          publishedTime: post.date,
          modifiedTime: post.updatedAt,
          url: `/articles/${post.id}`,
          images: post.images?.[0] ? [{url:post.images[0].url,alt:post.images[0].alt}] : undefined,
        },
      }
    : { title: "글을 찾을 수 없습니다" };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();
  const today = koreaDate();
  const post = await getPublishedArticle(slug);
  if (!post) notFound();
  const related = await getArticlePage({category:post.category,excludeId:post.id,today,limit:3});
  const headings = post.bodyDocument
    ? documentHeadings(post.bodyDocument)
    : post.body.split("\n\n").filter(p => p.startsWith("## ")).map(p => p.slice(3).split("\n")[0]);
  const practice = post.id === "court-doubles-service-order-20261015";
  const contents = headings.map((label, i) => <a key={i} href={`#section-${i}`}>{label}</a>);
  return (
    <>
      <Header active={post.category} />
      <main id="main" className="wrap article-page">
        <Link className="back-link" href={`/articles?category=${encodeURIComponent(post.category)}`}>
          <ArrowLeft size={16} /> {post.category} 목록
        </Link>
        <div className="article-layout">
          <article>
            <div className="article-category">{post.category}</div>
            <h1>{post.title}</h1>
            <p className="article-deck">{post.excerpt}</p>
            <div className="article-byline">
              <span className="author-avatar">
                <img src="/logo.svg" width="26" height="26" alt="" />
              </span>
              <Link href="/about"><strong>Minton Today</strong></Link>
              <span>
                발행 {post.date.replaceAll("-", ".")} · {readingTime(post.body)}분
                읽기
                {post.updatedAt && koreaDate(new Date(post.updatedAt)) !== post.date && <span className="modified-date">수정 {new Date(post.updatedAt).toLocaleString("ko-KR", {timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>}
              </span>
            </div>
            {post.seriesDate && <p className="series-label">창간 기획 연재 · {post.seriesDate.replaceAll("-", ".")} 편</p>}
            {post.newsDate && <p className="series-label">원문 보도·기록 기준일 · {post.newsDate.replaceAll("-", ".")}</p>}
            {!post.images?.length && <Art kind={post.art} large />}
            {post.sample && (
              <div className="sample-note">
                예시 원고 · 사이트 구성을 보여 주는 콘텐츠입니다. 실제 발행 전
                운영자 검토가 필요합니다.
              </div>
            )}
            <ArticleTools id={post.id} title={post.title} category={post.category} />
            {!!contents.length && <details className="mobile-contents"><summary><List size={17}/>글 목차</summary><nav aria-label="본문 목차">{contents}</nav></details>}
            {practice && <ServicePractice />}
            <ArticleContent post={post} />
            {post.sourceUrl && !post.sources?.some(s => s.url === post.sourceUrl) && (
              <a
                className="source-box"
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                  함께 확인할 원문 출처
                  <strong>{post.sourceName || "원문 보기"}</strong>
                </span>
                <ArrowUpRight size={20} />
              </a>
            )}
            <div className="article-signoff">
              <img src="/logo.svg" width="40" height="40" alt="" />
              <p>
                <Link href="/about"><strong>Minton Today</strong></Link>
                <br/><Link href="/contact">내용 정정·제보하기</Link> · <Link href="/editorial">편집 원칙</Link>
              </p>
            </div>
          </article>
          <aside className="article-aside">
            {!!headings.length && <div className="toc">
              <h2>글 목차</h2>
              <nav aria-label="본문 목차">{contents}</nav>
            </div>}
          </aside>
        </div>
        <section className="related">
          <div className="section-heading">
            <h2>다음으로 읽어볼 이야기</h2>
          </div>
          <div className="article-grid">
            {related.posts.map((p) => (
                <ArticleCard post={p} key={p.id} />
              ))}
          </div>
        </section>
        {!post.sample && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeStructuredData(articleStructuredData(post, siteUrl())),
            }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
