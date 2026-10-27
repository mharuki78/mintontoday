import { siteUrl } from "@/lib/site-url";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header, Footer, Art, ArticleCard } from "@/components/site";
import ArticleTools from "@/components/article-tools";
import { ArticleContent } from "@/components/article-content";
import { getPublishedArticle, getArticlePage } from "@/lib/public-content";
import { readingTime, koreaDate } from "@/lib/content";
import { connection } from "next/server";
import { articleHashtags } from "@/lib/hashtags";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
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
  const paragraphs = post.body.split("\n\n");
  const headings = paragraphs.filter((p) => p.startsWith("## "));
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
            <ArticleContent post={post} />
            {post.sourceUrl && (
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
                코트 안팎, 배드민턴의 모든 이야기.
                <br />
                <Link href="/about"><strong>Minton Today</strong></Link>
                <br/><Link href="/contact">내용 정정·제보하기</Link> · <Link href="/editorial">편집 원칙</Link>
              </p>
            </div>
          </article>
          <aside className="article-aside">
            {!!headings.length && <div className="toc">
              <h2>이 글에서 만날 이야기</h2>
              {headings.map((h, i) => (
                <a key={h} href={`#section-${i}`}>
                  {h.slice(3)}
                </a>
              ))}
            </div>}
            <div className="reader-note"><h2>궁금한 점이 남았나요?</h2><p>틀린 기록이나 다뤘으면 하는 연습 주제를 알려주세요.</p><Link href="/contact">운영자에게 문의하기 ↗</Link><Link href="/saved">내가 저장한 글 보기 ↗</Link></div>
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
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": post.category === "뉴스" ? "NewsArticle" : "BlogPosting",
                headline: post.title,
                description: post.excerpt,
                datePublished: post.date,
                dateModified: post.updatedAt || post.date,
                image: post.images?.map(i => new URL(i.url, siteUrl()).href),
                inLanguage: "ko-KR",
                articleSection: post.category,
                keywords: articleHashtags(post).join(", "),
                author: { "@type": "Organization", name: "Minton Today", url: `${siteUrl()}/about` },
                publisher: { "@type": "Organization", name: "Minton Today", url: siteUrl(), logo: { "@type": "ImageObject", url: `${siteUrl()}/apple-icon.png` } },
                mainEntityOfPage: `${siteUrl()}/articles/${post.id}`,
              }).replace(/</g, "\\u003c"),
            }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
