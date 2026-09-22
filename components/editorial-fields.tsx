"use client";
import { tournamentTypes, type Article } from "@/lib/content";
export function EditorialFields({ post, update }: { post: Article; update: <K extends keyof Article>(key: K, value: Article[K]) => void }) {
  const images = post.images || [];
  const sources = post.sources || [];
  const event = post.event || { type: "국가대표 대회", region: "해외", venue: "", registration: "", result: "확인 중", status: "확인 중", url: "", checkedAt: new Date().toISOString() };
  return <fieldset className="editorial-fields"><legend>사진·출처·대회 정보</legend>
    <p>레슨 본문 {post.body.replace(/\s/g, "").length.toLocaleString()}자 (공백 제외). 레슨은 2,000자 이상, 장비 리뷰는 실제 사진 2장 이상이 필요합니다.</p>
    <label className="form-field">창간 기획 연재일 (실제 발행일과 별도)<input type="date" value={post.seriesDate || ""} onChange={e => update("seriesDate", e.target.value || undefined)} /></label>
    {post.category === "뉴스" && <label className="form-field">원문 보도·기록 기준일<input type="date" value={post.newsDate || ""} onChange={e => update("newsDate", e.target.value || undefined)} /></label>}
    <label className="form-field">편집 안내<textarea value={post.editorialNote || ""} onChange={e => update("editorialNote", e.target.value)} placeholder="자료 기반 리뷰 여부, 번역·요약 안내 등" /></label>
    {images.map((img, i) => <fieldset key={i}><legend>이미지 {i + 1}</legend>
      {([['url', '이미지 URL'], ['alt', '대체 텍스트'], ['caption', '사진 설명'], ['credit', '저작자·제공처'], ['sourceUrl', '원본 출처 URL'], ['rights', '사용 근거·라이선스']] as const).map(([key, label]) => <label key={key} className="form-field">{label}<input value={img[key]} onChange={e => update("images", images.map((v, j) => j === i ? { ...v, [key]: e.target.value } : v))} /></label>)}
      <label className="form-field">종류<select value={img.kind} onChange={e => update("images", images.map((v, j) => j === i ? { ...v, kind: e.target.value as typeof img.kind } : v))}><option value="photo">실제 사진</option><option value="poster">대회 포스터</option><option value="illustration">일러스트</option></select></label>
      <button type="button" className="secondary-button" onClick={() => update("images", images.filter((_, j) => j !== i))}>이미지 제거</button>
    </fieldset>)}
    <button type="button" className="secondary-button" onClick={() => update("images", [...images, { url: "", alt: "", caption: "", credit: "", sourceUrl: "", rights: "", kind: "photo" }])}>사진·포스터 추가</button>
    {sources.map((s, i) => <div className="form-row" key={i}><label className="form-field">출처 이름<input value={s.name} onChange={e => update("sources", sources.map((v, j) => j === i ? { ...v, name: e.target.value } : v))} /></label><label className="form-field">원문 URL<input value={s.url} onChange={e => update("sources", sources.map((v, j) => j === i ? { ...v, url: e.target.value } : v))} /></label><button type="button" onClick={() => update("sources", sources.filter((_, j) => j !== i))}>삭제</button></div>)}
    <button type="button" className="secondary-button" onClick={() => update("sources", [...sources, { name: "", url: "" }])}>참고 출처 추가</button>
    {post.category === "대회" && <fieldset><legend>대회 일정과 결과</legend>
      <label className="form-field">구분<select value={event.type} onChange={e => update("event", { ...event, type: e.target.value as typeof event.type, region: e.target.value === "국내 동호인 대회" ? "서울" : "해외" })}>{tournamentTypes.map(t => <option key={t}>{t}</option>)}</select></label>
      <label className="form-field">지역<select value={event.region} onChange={e => update("event", { ...event, region: e.target.value as typeof event.region })}>{["해외", "전국", "서울", "경기"].map(r => <option key={r}>{r}</option>)}</select></label>
      {([['startDate', '시작일'], ['endDate', '종료일'], ['venue', '장소'], ['registration', '접수 안내'], ['result', '결과'], ['url', '공식 링크']] as const).map(([key, label]) => <label className="form-field" key={key}>{label}<input type={key.endsWith("Date") ? "date" : "text"} value={event[key] || ""} onChange={e => update("event", { ...event, [key]: e.target.value || undefined, checkedAt: new Date().toISOString() })} /></label>)}
      <label className="form-field">상태<select value={event.status} onChange={e => update("event", { ...event, status: e.target.value as typeof event.status, checkedAt: new Date().toISOString() })}>{["예정", "접수 중", "진행 중", "종료", "취소", "확인 중"].map(s => <option key={s}>{s}</option>)}</select></label>
    </fieldset>}
  </fieldset>;
}
