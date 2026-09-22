import Link from "next/link";
import { ArrowUpRight, ArrowRight, Search, Feather } from "lucide-react";
import { categories, type Article, readingTime } from "@/lib/content";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Minton Today 홈"
      className={`brand ${small ? "small" : ""}`}
    >
      <img src="/logo.svg" width="52" height="52" alt="" />
      <span>
        Minton
        <span className="brand-today">
          Today<span className="brand-dot">.</span>
        </span>
      </span>
    </Link>
  );
}
export function Header({ active = "전체 글" }: { active?: string }) {
  return (
    <>
      <div className="topline">
        <div className="wrap">
          <span>코트 안팎, 배드민턴의 모든 이야기</span>
          <Link href="/about">
            민턴투데이 소개 <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      <header className="wrap masthead">
        <Logo />
        <p>
          당신의 일상에
          <br />
          <strong>배드민턴 한 페이지.</strong>
        </p>
        <form className="header-search" action="/articles">
          <Search size={18} />
          <input
            name="q"
            aria-label="검색어"
            placeholder="어떤 이야기를 찾으세요?"
          />
          <button aria-label="검색">
            <ArrowRight size={17} />
          </button>
        </form>
        <Link
          className="mobile-search"
          href="/articles"
          aria-label="이야기 검색"
        >
          <Search size={21} />
        </Link>
      </header>
      <nav className="navigation" aria-label="주 메뉴">
        <div className="wrap nav-inner">
          <Link
            className={active === "전체 글" ? "active" : ""}
            href="/articles"
          >
            전체 글
          </Link>
          {categories.map((c) => (
            <Link
              className={active === c ? "active" : ""}
              key={c}
              href={`/articles?category=${encodeURIComponent(c)}`}
            >
              {c}
            </Link>
          ))}
          <span className="nav-note">
            <span /> A GOOD DAY TO PLAY
          </span>
        </div>
      </nav>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="wrap footer-main">
        <div>
          <Logo small />
          <p>
            코트에서 시작해, 일상으로 이어지는 이야기.
            <br />
            배드민턴을 좋아하는 당신과 함께합니다.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/about">소개</Link>
          <Link href="/contact">문의하기</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
          <Link href="/editorial">편집 원칙</Link>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>
          © {new Date().getFullYear()} Minton Today. All rights reserved.
        </span>
        <Link href="/admin">
          운영자 로그인 <ArrowUpRight size={12} />
        </Link>
      </div>
    </footer>
  );
}
export function Art({
  kind,
  large = false,
}: {
  kind: Article["art"];
  large?: boolean;
}) {
  return (
    <div
      className={`art art-${kind} ${large ? "art-large" : ""}`}
      aria-hidden="true"
    >
      {kind === "racket" ? (
        <>
          <svg viewBox="0 0 360 220">
            <defs>
              <pattern
                id="strings"
                width="12"
                height="12"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M12 0H0V12"
                  fill="none"
                  stroke="#f8f6ef"
                  strokeWidth="1.5"
                />
              </pattern>
            </defs>
            <g transform="translate(160 92) rotate(32)">
              <ellipse
                cy="-14"
                rx="44"
                ry="57"
                fill="url(#strings)"
                stroke="#13426f"
                strokeWidth="7"
              />
              <path d="M0 44v65" stroke="#13426f" strokeWidth="6" />
              <path d="M0 98v40" stroke="#f8f6ef" strokeWidth="13" />
            </g>
            <g transform="translate(250 135) rotate(-25)">
              <path
                d="m-16-28 8 36h17l8-36-10 6-8-8-7 8z"
                fill="#fffdf5"
                stroke="#13426f"
                strokeWidth="2"
              />
              <path d="M-8 7H9v10a8.5 8.5 0 0 1-17 0Z" fill="#13426f" />
            </g>
          </svg>
          <span className="art-word">
            FIND YOUR
            <br />
            OWN BALANCE.
          </span>
        </>
      ) : kind === "footwork" || kind === "court" ? (
        <svg viewBox="0 0 360 220">
          <g
            transform="translate(82 25) rotate(-12 100 90)"
            fill="none"
            stroke="#fffdf5"
            strokeWidth="2"
          >
            <path d="M0 0h196v180H0zM15 0v180M181 0v180M0 90h196M0 55h196M0 125h196M98 0v55M98 125v55" />
            <path d="M0 90h196" stroke="#13426f" strokeWidth="3" />
            {kind === "footwork" && (
              <>
                <circle cx="98" cy="137" r="12" fill="#13426f" stroke="none" />
                <path
                  d="m98 119 31-37m-3 0 6-4-1 8"
                  stroke="#13426f"
                  strokeDasharray="4 4"
                />
              </>
            )}
          </g>
          <text x="23" y="196" fill="#13426f" fontSize="12" fontWeight="700">
            {kind === "court" ? "SEE YOU ON COURT." : "ONE STEP AHEAD."}
          </text>
        </svg>
      ) : kind === "score" ? (
        <svg viewBox="0 0 360 220">
          <path
            d="M0 170h360M55 0v220M305 0v220"
            stroke="#ffffff"
            opacity=".4"
          />
          <rect x="78" y="43" width="204" height="133" rx="9" fill="#13426f" />
          <text
            x="180"
            y="77"
            fill="#dcecdf"
            fontSize="12"
            textAnchor="middle"
            letterSpacing="3"
          >
            LOVE THE GAME
          </text>
          <path d="M180 91v61" stroke="#7191a4" />
          <text
            x="130"
            y="140"
            fill="#f9f7f0"
            fontSize="48"
            textAnchor="middle"
            fontWeight="700"
          >
            21
          </text>
          <text
            x="230"
            y="140"
            fill="#f9f7f0"
            fontSize="48"
            textAnchor="middle"
            fontWeight="700"
          >
            19
          </text>
        </svg>
      ) : kind === "shuttle" ? (
        <>
          <img src="/logo.svg" alt="" />
          <span className="art-caption">
            A LITTLE SHUTTLE.
            <br />A LOT OF STORIES.
          </span>
        </>
      ) : (
        <>
          <Feather size={74} strokeWidth={1} />
          <span className="art-caption">
            PACK LIGHT.
            <br />
            PLAY HAPPY.
          </span>
        </>
      )}
    </div>
  );
}
export function ArticleCard({ post }: { post: Article }) {
  return (
    <article className="article-card">
      <Link
        href={`/articles/${post.id}`}
        className="card-image"
        tabIndex={-1}
        aria-hidden="true"
      >
        {post.images?.[0] ? <img className="card-photo" src={post.images[0].url} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <Art kind={post.art} />}
        <span className="image-link">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="card-category">
        {post.event?.type || post.category}
        <span>{readingTime(post.body)}분 읽기</span>
      </div>
      <h3>
        <Link href={`/articles/${post.id}`}>{post.title}</Link>
      </h3>
      <p>{post.excerpt}</p>
      {post.event?.startDate && <p className="card-event-date">대회 {post.event.startDate.replaceAll("-", ".")}{post.event.endDate && post.event.endDate !== post.event.startDate ? ` — ${post.event.endDate.slice(5).replace("-", ".")}` : ""} · {post.event.region}</p>}
      <div className="card-meta">
        <span>Minton Today</span>
        <span>
          {post.seriesDate ? `창간 연재 ${post.seriesDate.slice(5).replace("-", ".")}` : post.date.replaceAll("-", ".")} {post.sample && "· 예시"}
        </span>
      </div>
    </article>
  );
}
export function AdSpace({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`ad-space ${compact ? "compact" : ""}`}
      aria-label="광고 예정 영역"
    >
      <span>ADVERTISEMENT</span>
      <div>잠깐의 쉼, 다음 이야기.</div>
      <small>광고가 들어갈 공간입니다</small>
    </aside>
  );
}
