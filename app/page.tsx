import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bookmark, Layers } from "lucide-react";
import { connection } from "next/server";
import { Header, Footer, ArticleCard, Art } from "@/components/site";
import { beginnerPath } from "@/lib/reading-paths";
import { getArticlePage } from "@/lib/public-content";
import { categories, koreaDate } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";
import { homeStructuredData, serializeStructuredData } from "@/lib/structured-data";

export const metadata = { alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } } };

const categoryUrl = (category: string) => "/articles?" + new URLSearchParams({ category });
const practiceUrl = "/articles/court-doubles-service-order-20261015#service-practice";

export default async function Home() {
  await connection();
  const today = koreaDate();
  const [shelves, news, events] = await Promise.all([
    Promise.all(categories.slice(0, 3).map(category => getArticlePage({ category, today, limit: 4 }))),
    getArticlePage({ category: "뉴스", today, limit: 3 }),
    getArticlePage({ category: "대회", type: "국내 동호인 대회", today, limit: 3 }),
  ]);
  const recent = shelves.flatMap(shelf => shelf.posts).sort((a, b) => b.date.localeCompare(a.date));
  const lead = recent.find(p => p.category !== "장비 이야기" && p.images?.[0]) || recent[0] || news.posts[0];
  const picture = lead?.images?.[0];
  const bulletins = news.posts.filter(p => p.id !== lead?.id);

  return <>
    <Header />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(homeStructuredData(siteUrl())) }} />
    <main id="main" className="wrap journal">
      {lead && <section className="cover" aria-labelledby="cover-title">
        <Link href={`/articles/${lead.id}`} className="cover-visual" tabIndex={-1} aria-hidden="true">
          {picture ? <img src={picture.url} alt="" fetchPriority="high" referrerPolicy="no-referrer" /> : <Art kind={lead.art} large />}
          {picture?.generated && <span className="cover-credit">AI 일러스트</span>}
        </Link>
        <div className="cover-story">
          <div className="cover-meta"><Link href={categoryUrl(lead.category)}>{lead.category}</Link><time dateTime={lead.date}>{lead.date.replaceAll("-", ".")}</time></div>
          <h1 id="cover-title"><Link href={`/articles/${lead.id}`}>{lead.title}</Link></h1>
          <p>{lead.excerpt}</p>
          <Link className="cover-read" href={`/articles/${lead.id}`}>이 글 읽기 <ArrowRight size={17} /></Link>
        </div>
      </section>}
      <section className="journal-paths" aria-label="입문과 규칙 연습">
        <div><Bookmark size={21} /><h2>첫 레슨 가이드</h2></div>
        <nav aria-label="첫 레슨 가이드">{beginnerPath.map(s => <Link key={s.id} href={`/articles/${s.id}`}>{s.title} <ArrowUpRight size={14}/></Link>)}</nav>
        <Link className="practice-link" href={practiceUrl}><Layers size={17}/> 복식 서브 연습판 <ArrowRight size={16}/></Link>
      </section>
      {!!bulletins.length && <section className="journal-news" aria-labelledby="news-title">
        <div className="desk-heading"><h2 id="news-title">배드민턴 뉴스</h2><Link href={categoryUrl("뉴스")}>뉴스 전체 <ArrowRight size={15}/></Link></div>
        <div className="bulletins">{bulletins.map(p => <Link key={p.id} href={`/articles/${p.id}`}>
          <time dateTime={p.date}>{p.date.replaceAll("-", ".")}</time><h3>{p.title}</h3>
        </Link>)}</div>
        <nav className="record-links" aria-label="배드민턴 공식 기록">
          <a href="https://bwfworldtour.bwfbadminton.com/" target="_blank" rel="noopener noreferrer">BWF 월드투어 기록 <ArrowUpRight size={14}/></a>
          <a href="https://www.koreabadminton.org/" target="_blank" rel="noopener noreferrer">대한배드민턴협회 <ArrowUpRight size={14}/></a>
        </nav>
      </section>}
      {categories.slice(0, 3).map((category, i) => {
        const posts = shelves[i].posts.filter(p => p.id !== lead?.id).slice(0, 3);
        return posts.length > 0 && <section className="journal-shelf" key={category} aria-labelledby={`shelf-${i}`}>
          <div className="desk-heading"><h2 id={`shelf-${i}`}>{category}</h2><Link href={categoryUrl(category)}>모두 보기 <ArrowRight size={15}/></Link></div>
          <div className="article-grid">{posts.map(p => <ArticleCard key={p.id} post={p}/>)}</div>
        </section>;
      })}
      {!!events.posts.length && <section className="journal-shelf" aria-labelledby="calendar-title">
        <div className="desk-heading"><h2 id="calendar-title">서울·경기 대회 일정</h2><Link href={categoryUrl("대회") + "&" + new URLSearchParams({type:"국내 동호인 대회"})}>모든 대회 <ArrowRight size={15}/></Link></div>
        <div className="article-grid">{events.posts.map(p => <ArticleCard key={p.id} post={p}/>)}</div>
      </section>}
      {!lead && <h1>민턴투데이 배드민턴 매거진</h1>}
    </main>
    <Footer />
  </>;
}
