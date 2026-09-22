import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronRight } from "lucide-react";
import { Header, Footer, ArticleCard, AdSpace } from "@/components/site";
import { publishedArticles } from "@/lib/store";
import { categories } from "@/lib/content";
export const dynamic = "force-dynamic";
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
  const posts = await publishedArticles();
  return (
    <>
      <Header />
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
            <div className="hero-image">
              <img
                src="/images/badminton.png"
                alt="파스텔 민트와 하늘색 라켓, 셔틀콕이 떠 있는 작은 배드민턴 코트"
                fetchPriority="high"
              />
              <div className="image-stamp">
                LOVE
                <br />
                THE GAME<span>PLAY · READ · REPEAT</span>
              </div>
            </div>
          </section>
          <aside className="briefing">
            <div className="section-top">
              <h2>코트 밖 소식</h2>
              <ArrowUpRight size={20} />
            </div>
            <p className="briefing-intro">배드민턴 소식, 공식 출처에서.</p>
            <div className="source-list">
              {sources.map((s, i) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="source-index">0{i + 1}</span>
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.desc}</small>
                  </span>
                  <ArrowUpRight size={17} />
                </a>
              ))}
            </div>
            <div className="briefing-note">
              <BookOpen size={19} />
              <p>
                좋은 이야기는
                <br />
                <strong>정확한 출처에서 시작됩니다.</strong>
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
            {posts.slice(0, 3).map((p) => (
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
            href={`/articles?category=${encodeURIComponent("레슨 & 가이드")}`}
          >
            입문 가이드 만나기 <ArrowRight size={18} />
          </Link>
        </div>
        <div className="bottom-grid">
          <section>
            <div className="section-heading">
              <div>
                <h2>조금 더 깊이, 민턴</h2>
                <p>코트에 가져가고 싶은 작은 발견들</p>
              </div>
            </div>
            <div className="reading-list">
              {posts.slice(3, 6).map((p, i) => (
                <Link href={`/articles/${p.id}`} key={p.id}>
                  <span className="reading-number">0{i + 1}</span>
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
          <AdSpace compact />
        </div>
        <div className="editor-note">
          레슨과 장비, 코트의 일상은 블로그로. 뉴스와 대회 소식은 확인한 출처와 함께 전합니다.
        </div>
      </main>
      <Footer />
    </>
  );
}
