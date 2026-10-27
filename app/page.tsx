import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronRight } from "lucide-react";
import { Header, Footer, ArticleCard } from "@/components/site";
import { beginnerPath } from "@/lib/reading-paths";
import { ShuttleFlight } from "@/components/shuttle-flight";
import { getArticlePage } from "@/lib/public-content";
import { categories, koreaDate } from "@/lib/content";
import { connection } from "next/server";
import { siteUrl } from "@/lib/site-url";
import { homeStructuredData, serializeStructuredData } from "@/lib/structured-data";
export const metadata = { alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } } };
const sources = [
  {
    name: "BWF 공식 뉴스",
    desc: "세계 배드민턴의 소식",
    url: "https://bwfbadminton.com/news/",
  },
  {
    name: "BWF 월드투어",
    desc: "대회 일정과 경기 결과",
    url: "https://bwfworldtour.bwfbadminton.com/",
  },
  {
    name: "대한배드민턴협회",
    desc: "국내 배드민턴 소식",
    url: "https://www.koreabadminton.org/",
  },
];
export default async function Home() {
  await connection();
  const today = koreaDate();
  const [shelves, news, events] = await Promise.all([
    Promise.all(categories.slice(0,3).map(category=>getArticlePage({category,today,limit:4}))),
    getArticlePage({category:"뉴스",today,limit:3}),
    getArticlePage({category:"대회",type:"국내 동호인 대회",today,limit:3}),
  ]);
  const upcoming = events.posts;
  const featured = shelves.flatMap(shelf=>shelf.posts.slice(0,1));
  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeStructuredData(homeStructuredData(siteUrl()))}}/>
      <main id="main" className="wrap">
        <div className="edition">
          <span>
            <span className="live-dot" /> 오늘의 배드민턴을 읽다
          </span>
          <span>배드민턴을 좋아하는 모든 순간을 위해</span>
        </div>
        <div className="lead-grid">
          <section className="hero">
            <div className="hero-copy">
              <h1>
                오늘도,
                <br />
                <span>배드민턴.</span>
              </h1>
              <p>
                첫 랠리의 설렘부터
                <br />
                코트 밖의 이야기까지.
                <br />
                우리의 배드민턴은 매일 이어집니다.
              </p>
              <Link className="primary-button" href="/articles">
                오늘의 이야기 읽기 <ArrowRight size={18} />
              </Link>
              <div className="hero-caption">
                <span /> YOUR DAILY BADMINTON JOURNAL
              </div>
            </div>
            <ShuttleFlight />
          </section>
          <aside className="briefing">
            <div className="section-top">
              <h2>배드민턴이 처음이라면</h2>
              <ArrowUpRight size={20} />
            </div>
            <p className="briefing-intro">첫 레슨부터 그립과 짧은 서브까지, 이 순서로 읽어보세요.</p>
            <div className="source-list">
              {beginnerPath.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/articles/${s.id}`}
                >
                  <span className="source-index">0{i + 1}</span>
                  <span>
                    <strong>{s.title}</strong>
                    <small>{s.detail}</small>
                  </span>
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
            <div className="briefing-note">
              <BookOpen size={19} />
              <p>
                연습이 잘 안 풀리는 날에는
                <br />
                <strong>기본기부터 다시 짚어봅니다.</strong>
              </p>
            </div>
          </aside>
        </div>
        <section className="latest" aria-labelledby="latest-title">
          <div className="section-heading">
            <div>
              <h2 id="latest-title">
                새로 나온 이야기<span className="small-dot">.</span>
              </h2>
              <p>알아갈수록 더 좋아지는 배드민턴</p>
            </div>
            <Link href="/articles">
              전체 글 보기 <ArrowRight size={17} />
            </Link>
          </div>
          <div className="category-row">
            <Link href="/articles" className="selected">
              전체
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/articles?category=${encodeURIComponent(c)}`}
              >
                {c}
              </Link>
            ))}
          </div>
          <div className="article-grid">
            {featured.map((p) => (
              <ArticleCard key={p.id} post={p} />
            ))}
          </div>
        </section>
        <div className="mid-banner">
          <div className="round-icon">
            <img src="/logo.svg" width="46" height="46" alt="" />
          </div>
          <div>
            <h2>처음이라 더 즐거운, 배드민턴</h2>
            <p>라켓을 고르는 순간부터 첫 게임까지. 시작을 함께할 이야기.</p>
          </div>
          <Link
            href="/articles/lesson-first-month-practice-plan"
          >
            입문 가이드 만나기 <ArrowRight size={18} />
          </Link>
        </div>
        <div className="bottom-grid">
          <section>
            <div className="section-heading">
              <div>
                <h2>지금, 배드민턴 뉴스</h2>
                <p>한국 선수와 세계 코트의 소식</p>
              </div>
            </div>
            <div className="reading-list">
              {news.posts.map((p, i) => (
                <Link href={`/articles/${p.id}`} key={p.id}>
                  {p.images?.[0] ? <img className="reading-photo" src={p.images[0].url} alt="" loading="lazy" /> : <span className="reading-number">0{i + 1}</span>}
                  <span>
                    <small>{p.category}</small>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                  </span>
                  <ChevronRight size={22} />
                </Link>
              ))}
            </div>
          </section>
          <aside className="official-reading" aria-labelledby="official-title">
            <h2 id="official-title">직접 찾아볼 기록</h2>
            <p>대진표와 발표 원문이 필요할 때.</p>
            {sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"><strong>{s.name}</strong><span>{s.desc} <ArrowUpRight size={14}/></span></a>)}
            <Link href="/editorial">출처와 편집 원칙 <ArrowRight size={15}/></Link>
          </aside>
        </div>
        {!!upcoming.length && <section className="category-shelf" aria-labelledby="upcoming-title">
          <div className="section-heading"><div><h2 id="upcoming-title">다음 대회, 어디로 갈까요?</h2><p>서울·경기 예정 대회 {events.total}개 · 가까운 일정부터</p></div><Link href={`/articles?${new URLSearchParams({ category: "대회", type: "국내 동호인 대회" })}`}>모든 대회 <ArrowRight size={17} /></Link></div>
          <div className="article-grid">{upcoming.slice(0, 3).map(p => <ArticleCard key={p.id} post={p} />)}</div>
        </section>}
        {categories.slice(0, 3).map((c, i) => <section className="category-shelf" key={c} aria-labelledby={`shelf-${i}`}>
          <div className="section-heading"><div><h2 id={`shelf-${i}`}>{c}</h2><p>{["한 가지씩 익히는 코트 위의 기본", "실물 사진과 근거로 살펴보는 장비", "함께 오래 즐기는 배드민턴 생활"][i]} · {shelves[i].total}편</p></div><Link href={`/articles?category=${encodeURIComponent(c)}`}>모두 읽기 <ArrowRight size={17} /></Link></div>
          <div className="article-grid">{shelves[i].posts.slice(1,4).map(p => <ArticleCard key={p.id} post={p} />)}</div>
        </section>)}
        <div className="editor-note">
          레슨과 장비, 코트의 일상은 블로그로. 뉴스와 대회 소식은 확인한 출처와 함께 전합니다.
        </div>
      </main>
      <Footer />
    </>
  );
}
