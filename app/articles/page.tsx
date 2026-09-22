import { Header, Footer, ArticleCard } from "@/components/site";
import { categories, tournamentTypes } from "@/lib/content";
import { publishedArticles } from "@/lib/store";
import Link from "next/link";
import { Search, X } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata = { title: "모든 이야기" };
export default async function Articles({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; type?: string; region?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const category = categories.find((c) => c === params.category) || (params.category === "뉴스 & 대회" ? "뉴스" : undefined);
  const type = tournamentTypes.find(t => t === params.type);
  const region = ["서울", "경기"].find(r => r === params.region);
  const posts = (await publishedArticles()).filter(
    (p) =>
      (!category || p.category === category) &&
      (category !== "대회" || ((!type || p.event?.type === type) && (!region || p.event?.region === region))) &&
      (!q ||
        `${p.title} ${p.excerpt} ${p.body}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  return (
    <>
      <Header active={category || "전체 글"} />
      <main id="main" className="wrap archive">
        <div className="archive-title">
          <h1>
            {category || "모든 이야기"}
            <span className="small-dot">.</span>
          </h1>
          <p>
            {q ? `“${q}” 검색 결과` : "읽고, 배우고, 코트에서 다시 만나요."}
          </p>
        </div>
        <form className="archive-search">
          <Search size={20} />
          {category && <input type="hidden" name="category" value={category} />}
          {category === "대회" && type && <input type="hidden" name="type" value={type} />}
          {category === "대회" && region && <input type="hidden" name="region" value={region} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="관심 있는 이야기 검색"
            aria-label="이야기 검색"
          />
          <button className="primary-button">검색</button>
        </form>
        <div className="category-row">
          <Link className={!category ? "selected" : ""} href="/articles">
            전체
          </Link>
          {categories.map((c) => (
            <Link
              className={category === c ? "selected" : ""}
              key={c}
              href={`/articles?category=${encodeURIComponent(c)}`}
            >
              {c}
            </Link>
          ))}
        </div>
        {category === "대회" && <nav className="tournament-filters" aria-label="대회 구분">
          {[undefined, ...tournamentTypes].map(t => <Link key={t || "all"} className={type === t ? "selected" : ""} href={`/articles?${new URLSearchParams({ category: "대회", ...(t ? { type: t } : {}), ...(q ? { q } : {}) })}`}>{t || "모든 대회"}</Link>)}
          {type === "국내 동호인 대회" && [undefined, "서울", "경기"].map(r => <Link key={r || "both"} className={region === r ? "selected" : ""} href={`/articles?${new URLSearchParams({ category: "대회", type, ...(r ? { region: r } : {}), ...(q ? { q } : {}) })}`}>{r || "서울·경기 전체"}</Link>)}
        </nav>}
        <div className="result-count">
          {posts.length}개의 이야기{" "}
          {q && (
            <Link
              href={
                category
                  ? `/articles?category=${encodeURIComponent(category)}`
                  : "/articles"
              }
            >
              검색 초기화 <X size={14} />
            </Link>
          )}
        </div>
        {posts.length ? (
          <div className={category === "뉴스" ? "news-list" : "article-grid"}>
            {posts.map((p) => (
              <ArticleCard post={p} key={p.id} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Search size={34} />
            <h2>아직 이 이야기는 없어요.</h2>
            <p>다른 검색어를 입력하거나 전체 글을 살펴보세요.</p>
            <Link className="primary-button" href="/articles">
              전체 글 보기
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
