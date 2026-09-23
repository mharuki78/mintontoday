import { Header, Footer, ArticleCard } from "@/components/site";
import { categories, tournamentTypes, upcomingAmateur, koreaDate } from "@/lib/content";
import { publishedArticles } from "@/lib/store";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export async function generateMetadata({searchParams}: {searchParams: Promise<{q?:string;category?:string;type?:string;region?:string}>}): Promise<Metadata> {
  const params = await searchParams;
  const category = categories.find(c=>c===params.category) || (params.category === "뉴스 & 대회" ? "뉴스" : undefined);
  const descriptions: Record<string,string> = {
    "레슨 & 가이드": "배드민턴 그립, 서브, 네트샷과 풋워크를 배우는 레슨 가이드. 연습 순서와 흔한 실수, 실력 향상을 확인하는 방법을 소개합니다.",
    "장비 이야기": "요넥스·빅터 등 배드민턴 라켓, 셔틀콕, 가방의 공식 사양과 공개 후기를 비교하고 자신에게 맞는 장비 선택 기준을 살펴봅니다.",
    "코트 라이프": "배드민턴 동호회 매너부터 복식 파트너와의 소통, 코트 이용과 운동 기록까지. 함께 즐겁게 운동하는 데 필요한 이야기를 전합니다.",
    "뉴스": "한국 선수와 주요 해외 선수의 배드민턴 소식, 경기 결과와 다음 일정을 공식 자료와 원문 출처를 바탕으로 전합니다.",
    "대회": "국가대표 배드민턴 국제대회 일정·결과와 서울·경기 동호인 대회 접수, 장소, 포스터를 확인하세요.",
  };
  const canonical = category ? `/articles?${new URLSearchParams({category})}` : "/articles";
  const title = category ? `배드민턴 ${category}` : "배드민턴 뉴스·레슨·장비와 대회 이야기";
  const description = descriptions[category || ""] || "배드민턴 레슨과 장비 리뷰, 동호회 생활, 국내외 뉴스와 대회 일정을 Minton Today에서 만나세요.";
  return {title,description,alternates:{canonical},robots:params.q || params.type || params.region ? {index:false,follow:true}:undefined,openGraph:{title,description,url:canonical,type:"website"}};
}
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
  const today = koreaDate();
  const posts = (await publishedArticles()).filter(
    (p) =>
      (p.event?.type !== "국내 동호인 대회" || upcomingAmateur(p, today)) &&
      (!category || p.category === category) &&
      (category !== "대회" || ((!type || p.event?.type === type) && (!region || p.event?.region === region))) &&
      (!q ||
        `${p.title} ${p.excerpt} ${p.body}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  if (category === "대회") posts.sort((a, b) => (a.event?.startDate || "9999").localeCompare(b.event?.startDate || "9999") || a.title.localeCompare(b.title, "ko"));
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
        {category === "대회" && <p className="archive-note">동호인 대회는 서울·경기에서 오늘 이후 개최되는 일정만 표시합니다. 접수 마감일과 실제 잔여 자리는 다를 수 있으니 각 글의 원문을 확인해 주세요.</p>}
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
