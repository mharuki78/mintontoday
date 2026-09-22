import type { Article } from "@/lib/content";
import { ArticleImage } from "./article-image";
import { RichContent } from "./rich-content";

export function ArticleContent({ post }: { post: Article }) {
  const paragraphs = post.body.split("\n\n");
  let heading = 0;
  return <>
    {post.editorialNote && <p className="editorial-disclosure">{post.editorialNote}</p>}
    {post.event && <dl className="event-facts">
      <div><dt>구분</dt><dd>{post.event.type} · {post.event.region}</dd></div>
      <div><dt>일정</dt><dd>{post.event.startDate || "주최 측 확인 중"}{post.event.endDate && ` ~ ${post.event.endDate}`}</dd></div>
      <div><dt>장소</dt><dd>{post.event.venue}</dd></div>
      <div><dt>진행 상태</dt><dd>{post.event.status}</dd></div>
      <div><dt>접수 안내</dt><dd>{post.event.registration}</dd></div>
      <div><dt>경기 결과</dt><dd>{post.event.result}</dd></div>
      <div><dt>마지막 확인</dt><dd>{new Date(post.event.checkedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (한국 시간)</dd></div>
      <div><dt>안내 출처</dt><dd><a href={post.event.url} target="_blank" rel="noopener noreferrer">일정·접수·결과 원문 확인 ↗</a></dd></div>
    </dl>}
    {post.bodyDocument ? <RichContent document={post.bodyDocument} images={post.images}/> : <div className="prose">
      {paragraphs.map((p, i) => <div key={i}>
        {p.startsWith("## ") ? <h2 id={`section-${heading++}`}>{p.slice(3)}</h2> : <p>{p}</p>}
        {i === 0 && post.images?.[0] && <ArticleImage image={post.images[0]} />}
        {i === Math.max(1, Math.floor(paragraphs.length / 2)) && post.images?.slice(1).map(img => <ArticleImage key={img.url} image={img} />)}
      </div>)}
      {paragraphs.length === 1 && post.images?.slice(1).map(img => <ArticleImage key={img.url} image={img} />)}
    </div>}
    {!!post.sources?.length && <section className="article-sources"><h2>참고한 자료와 원문</h2><ul>{post.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a></li>)}</ul></section>}
  </>;
}
