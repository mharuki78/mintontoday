import { notFound } from "next/navigation";
import Link from "next/link";
import { Header, Footer, Art, ArticleCard, AdSpace } from "@/components/site";
import ArticleTools from "@/components/article-tools";
import { publishedArticles } from "@/lib/store";
import { readingTime } from "@/lib/content";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = (await publishedArticles()).find((p) => p.id === slug);
  return post
    ? {
        title: post.title,
        description: post.excerpt,
        alternates: { canonical: `/articles/${post.id}` },
        robots: post.sample ? { index: false, follow: true } : undefined,
        openGraph: {
          type: "article",
          title: post.title,
          description: post.excerpt,
          publishedTime: post.date,
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
  const all = await publishedArticles();
  const post = all.find((p) => p.id === slug);
  if (!post) notFound();
  const paragraphs = post.body.split("\n\n");
  const headings = paragraphs.filter((p) => p.startsWith("## "));
  return (
    <>
      <Header active={post.category} />
      <main id="main" className="wrap article-page">
        <Link className="back-link" href="/articles">
          <ArrowLeft size={16} /> 이야기 목록
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
              <strong>Minton Today</strong>
              <span>
                {post.date.replaceAll("-", ".")} · {readingTime(post.body)}분
                읽기
              </span>
            </div>
            <Art kind={post.art} large />
            {post.sample && (
              <div className="sample-note">
                예시 원고 · 사이트 구성을 보여 주는 콘텐츠입니다. 실제 발행 전
                운영자 검토가 필요합니다.
              </div>
            )}
            <ArticleTools id={post.id} />
            <div className="prose">
              {paragraphs.map((p, i) =>
                p.startsWith("## ") ? (
                  <h2 id={`section-${headings.indexOf(p)}`} key={i}>
                    {p.slice(3)}
                  </h2>
                ) : (
                  <p key={i}>{p}</p>
                ),
              )}
            </div>
            {post.sourceUrl && (
              <a
                className="source-box"
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                  함께 확인할 공식 출처
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
                <strong>Minton Today</strong>
              </p>
            </div>
          </article>
          <aside className="article-aside">
            <div className="toc">
              <h2>이 글에서 만날 이야기</h2>
              {headings.map((h, i) => (
                <a key={h} href={`#section-${i}`}>
                  {h.slice(3)}
                </a>
              ))}
            </div>
            <AdSpace compact />
          </aside>
        </div>
        <section className="related">
          <div className="section-heading">
            <h2>다음으로 읽어볼 이야기</h2>
          </div>
          <div className="article-grid">
            {all
              .filter((p) => p.id !== post.id)
              .slice(0, 3)
              .map((p) => (
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
                "@type": "BlogPosting",
                headline: post.title,
                description: post.excerpt,
                datePublished: post.date,
                author: { "@type": "Organization", name: "Minton Today" },
                mainEntityOfPage: `${process.env.SITE_URL || "http://localhost:3000"}/articles/${post.id}`,
              }).replace(/</g, "\\u003c"),
            }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
