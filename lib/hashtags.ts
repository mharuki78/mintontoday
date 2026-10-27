import type { Article } from "./content";

const categoryTags: Record<Article["category"], string[]> = {
  "레슨 & 가이드": ["배드민턴레슨", "배드민턴기초", "실력향상"],
  "장비 이야기": ["배드민턴장비", "장비리뷰", "장비선택"],
  "코트 라이프": ["배드민턴동호회", "코트매너", "배드민턴상식"],
  뉴스: ["배드민턴뉴스", "대한민국배드민턴", "선수소식"],
  대회: ["배드민턴대회", "대회일정"],
};

const topicRules: Array<{ terms: string[]; tag: string }> = [
  { terms: ["스플릿 스텝", "스플릿스텝"], tag: "스플릿스텝" },
  { terms: ["준비 자세", "준비자세", "레디 포지션"], tag: "배드민턴준비자세" },
  { terms: ["풋워크", "발 움직임", "스텝"], tag: "배드민턴풋워크" },
  { terms: ["헤어핀", "네트 샷", "네트샷"], tag: "배드민턴네트샷" },
  { terms: ["스매시", "스매싱"], tag: "배드민턴스매시" },
  { terms: ["클리어"], tag: "배드민턴클리어" },
  { terms: ["드롭 샷", "드롭샷", "드롭"], tag: "배드민턴드롭샷" },
  { terms: ["서브", "서비스"], tag: "배드민턴서브" },
  { terms: ["복식", "파트너"], tag: "배드민턴복식" },
  { terms: ["단식"], tag: "배드민턴단식" },
  { terms: ["초보", "입문", "첫 레슨"], tag: "배드민턴입문" },
  { terms: ["운동 기록", "연습 일지", "운동일지"], tag: "배드민턴연습기록" },
  { terms: ["동호회", "클럽"], tag: "배드민턴동호회" },
  { terms: ["매너", "예절", "규칙"], tag: "배드민턴코트매너" },
  { terms: ["촬영", "영상", "동작 분석"], tag: "배드민턴영상" },
  { terms: ["안전", "부상 예방", "부상예방"], tag: "배드민턴안전" },
  { terms: ["요넥스", "yonex"], tag: "요넥스" },
  { terms: ["빅터", "victor"], tag: "빅터" },
  { terms: ["리닝", "lining"], tag: "리닝" },
  { terms: ["아스트록스", "astrox"], tag: "요넥스아스트록스" },
  { terms: ["나노플레어", "nanoflare"], tag: "요넥스나노플레어" },
  { terms: ["아크세이버", "arcsaber"], tag: "요넥스아크세이버" },
  { terms: ["쓰러스터", "thruster"], tag: "빅터쓰러스터" },
  { terms: ["드라이브엑스", "drive x", "drivex"], tag: "빅터드라이브엑스" },
  { terms: ["셔틀콕", "깃털 셔틀"], tag: "배드민턴셔틀콕" },
  { terms: ["라켓", "스트링", "거트"], tag: "배드민턴라켓" },
  { terms: ["그립 테이프", "그립"], tag: "배드민턴그립" },
  { terms: ["배드민턴화", "실내화"], tag: "배드민턴화" },
  { terms: ["가방", "라켓백"], tag: "배드민턴가방" },
  { terms: ["무게", "밸런스", "샤프트"], tag: "라켓선택" },
  { terms: ["아시안게임"], tag: "아시안게임배드민턴" },
  { terms: ["세계선수권", "세계 선수권"], tag: "세계배드민턴선수권" },
  { terms: ["올림픽"], tag: "올림픽배드민턴" },
  { terms: ["코리아오픈", "코리아 오픈"], tag: "코리아오픈" },
  { terms: ["bwf", "세계배드민턴연맹"], tag: "BWF" },
  { terms: ["안세영"], tag: "안세영" },
  { terms: ["서승재"], tag: "서승재" },
  { terms: ["김원호"], tag: "김원호" },
  { terms: ["이소희"], tag: "이소희" },
  { terms: ["채유정"], tag: "채유정" },
  { terms: ["정나은"], tag: "정나은" },
  { terms: ["대회 결과", "경기 결과", "결승 결과"], tag: "배드민턴경기결과" },
  { terms: ["접수", "참가 신청", "참가신청"], tag: "동호인대회접수" },
  { terms: ["동호인 대회", "동호인대회"], tag: "동호인배드민턴대회" },
];

export function normalizeHashtag(value: string) {
  const tag = value.normalize("NFC").trim().replace(/^#+/, "").replace(/\s+/g, "");
  return /^[\p{L}\p{N}_-]{1,40}$/u.test(tag) ? tag : "";
}

export function parseHashtagInput(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[\n,]/)
    .map(normalizeHashtag)
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

export function articleHashtags(post: Pick<Article,"title" | "excerpt" | "category"> & Partial<Pick<Article,"body" | "tags">> & {event?: Pick<NonNullable<Article["event"]>,"type" | "region" | "status">}): string[] {
  const base = [...categoryTags[post.category]];
  if (post.category === "대회" && post.event) {
    base.unshift(post.event.type === "국가대표 대회" ? "국가대표대회" : "동호인배드민턴대회");
    if (post.event.region === "서울") base.unshift("서울배드민턴");
    if (post.event.region === "경기") base.unshift("경기배드민턴");
    if (post.event.status === "종료") base.unshift("배드민턴경기결과");
  }

  // The same lightweight inputs are available on details, cards and the tag index.
  const searchable = [post.title, post.excerpt, post.category, post.event?.type, post.event?.region]
    .filter(Boolean)
    .join(" ")
    .normalize("NFC")
    .toLocaleLowerCase()
    .replace(/\s+/g, "");
  const chosen = [
    ...(post.tags || []).map(normalizeHashtag).filter(Boolean),
    ...base,
    ...topicRules
      .filter((rule) => rule.terms.some((term) => searchable.includes(term.normalize("NFC").toLocaleLowerCase().replace(/\s+/g, ""))))
      .map((rule) => rule.tag),
  ];
  const seen = new Set<string>();
  return chosen
    .map(normalizeHashtag)
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}
