"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, LogOut, Save, ExternalLink, KeyRound } from "lucide-react";
import { categories, type Article } from "@/lib/content";
import { ArticleContent } from "./article-content";
import { EditorialFields } from "./editorial-fields";
import { PasswordSettings } from "./password-settings";
import { RichEditor } from "./rich-editor";
import { richText, type RichNode } from "@/lib/rich-text";
export function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="login-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const data = new FormData(e.currentTarget);
        try {
          const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: data.get("password") }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          router.refresh();
        } catch (error) {
          setError(
            error instanceof Error ? error.message : "연결을 확인해 주세요.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1>다음 이야기를 시작할 시간.</h1>
      <p>Minton Today 운영자 공간입니다.</p>
      <label className="form-field">
        관리자 비밀번호
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={256}
        />
      </label>
      <button className="primary-button" disabled={busy}>
        {busy ? "확인 중…" : "로그인"}
      </button>
      <p className="form-status error" role="alert">
        {error}
      </p>
    </form>
  );
}
const newPost = (): Article => ({
  id: `story-${Date.now()}`,
  title: "",
  excerpt: "",
  body: "",
  category: categories[0],
  status: "draft",
  sample: false,
  date: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }),
  art: "court",
  sourceUrl: "",
  sourceName: "",
});
export function Editor({ initial }: { initial: Article[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initial);
  const [post, setPost] = useState<Article>(initial[0] || newPost());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState(false);
  const [passwordSettings, setPasswordSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  function update<K extends keyof Article>(key: K, value: Article[K]) {
    setPost((p) => ({ ...p, [key]: value }));
    setDirty(true);
    setMessage("");
  }
  function choose(next: Article) {
    if (busy || uploading) return;
    if (dirty && !confirm("저장하지 않은 변경 사항이 있습니다. 이동할까요?"))
      return;
    setPost(next);
    setDirty(false);
    setMessage("");
    setPreview(false);
  }
  async function save(status: Article["status"]) {
    if (busy || uploading) return;
    setBusy(true);
    setMessage("");
    setError(false);
    const next = { ...post, status };
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const saved: Article = data.article || next;
      setPosts((old) =>
        old.some((p) => p.id === next.id)
          ? old.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...old],
      );
      setPost(saved);
      setDirty(false);
      setMessage(
        status === "published"
          ? "발행했습니다. 사이트에서 확인할 수 있습니다."
          : "임시저장했습니다. 공개 목록에서는 보이지 않습니다.",
      );
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(
        e instanceof Error ? e.message : "네트워크 연결을 확인해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-toolbar">
        <span>
          {posts.length}개의 글 ·{" "}
          {posts.filter((p) => p.status === "published").length}개 공개
        </span>
        <div className="save-actions">
          <button className="secondary-button" disabled={busy || uploading} aria-expanded={passwordSettings} aria-controls="password-settings" onClick={() => setPasswordSettings(open => !open)}>
            <KeyRound size={16} /> {passwordSettings ? "비밀번호 설정 닫기" : "비밀번호 변경"}
          </button>
          <button className="primary-button" disabled={busy || uploading} onClick={() => choose(newPost())}>
            <Plus size={16} /> 새 글 작성
          </button>
          <button
            className="secondary-button"
            disabled={busy || uploading}
            onClick={async () => {
              if (
                dirty &&
                !confirm("저장하지 않은 내용이 있습니다. 로그아웃할까요?")
              )
                return;
              await fetch("/api/admin/login", { method: "DELETE" });
              router.refresh();
            }}
          >
            <LogOut size={15} /> 로그아웃
          </button>
        </div>
      </div>
      {passwordSettings && <PasswordSettings />}
      <div className="admin-grid">
        <aside className="admin-posts" aria-label="관리할 글 선택">
          <label className="form-field">글 검색<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="제목 검색"/></label>
          <label className="form-field">카테고리 필터<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">전체 카테고리</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
          {posts.filter(p=>(!filter||p.category===filter)&&p.title.toLowerCase().includes(query.toLowerCase())).map((p) => (
            <button
              className={p.id === post.id ? "active" : ""}
              key={p.id}
              disabled={busy || uploading}
              onClick={() => choose(p)}
            >
              <strong>{p.title}</strong>
              <small>
                {p.status === "published" ? "공개" : "임시저장"} · {p.category}
                {p.sample ? " · 예시" : ""}
              </small>
            </button>
          ))}
        </aside>
        <form
          className="admin-editor"
          onSubmit={(e) => {
            e.preventDefault();
            save("published");
          }}
        >
          <fieldset className="editor-fields" disabled={busy || uploading}>
          <label className="form-field">
            제목
            <input
              value={post.title}
              onChange={(e) => update("title", e.target.value)}
              required
              minLength={3}
              maxLength={140}
              placeholder="이야기의 제목을 입력하세요"
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              카테고리
              <select
                value={post.category}
                onChange={(e) =>
                  update("category", e.target.value as Article["category"])
                }
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              발행일
              <input
                type="date"
                required
                value={post.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </label>
          </div>
          <label className="form-field">
            요약
            <textarea
              rows={2}
              value={post.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              minLength={10}
              maxLength={300}
              required
            />
            <small>목록과 검색 결과에 표시됩니다.</small>
          </label>
          <label className="form-field">
            사진이 없을 때 기본 그림
            <select
              value={post.art}
              onChange={(e) => update("art", e.target.value as Article["art"])}
            >
              {[
                ["court", "민트 코트"],
                ["racket", "라켓"],
                ["shuttle", "셔틀콕"],
                ["bag", "코트 라이프"],
                ["footwork", "풋워크"],
                ["score", "스코어보드"],
              ].map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <div className="form-field"><span>본문</span>
            <RichEditor key={post.id} post={post} disabled={busy} onBusyChange={setUploading}
              onChange={(document: RichNode) => { setPost(p=>({...p,bodyDocument:document,body:richText(document)}));setDirty(true);setMessage(""); }}
              onPhoto={image=>{setPost(p=>({...p,images:[...(p.images||[]),image]}));setDirty(true);setMessage("");}}
            />
          </div>
          <div className="form-row">
            <label className="form-field">
              출처 이름
              <input
                value={post.sourceName}
                onChange={(e) => update("sourceName", e.target.value)}
                placeholder="예: BWF 공식 홈페이지"
                maxLength={100}
              />
            </label>
            <label className="form-field">
              출처 URL
              <input
                type="url"
                value={post.sourceUrl}
                onChange={(e) => update("sourceUrl", e.target.value)}
                placeholder="https://"
                pattern="https://.*"
              />
            </label>
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={post.sample}
              onChange={(e) => update("sample", e.target.checked)}
            />{" "}
            예시 원고로 표시 (검색엔진 색인 제외)
          </label>
          {!!post.images?.length && <label className="form-field">목록에 보여줄 대표 사진<select value={post.images[0].url} onChange={e=>{const selected=post.images!.find(i=>i.url===e.target.value)!;update("images",[selected,...post.images!.filter(i=>i.url!==selected.url)]);}}>{post.images.map((image,i)=><option key={image.url+i} value={image.url}>{image.alt}</option>)}</select></label>}
          <details className="editor-metadata"><summary>사진 설명·출처·대회 정보 편집</summary><EditorialFields post={post} update={(key,value)=>{
            if(key==="images" && post.bodyDocument){
              const images=value as Article["images"];const urls=new Set(images?.map(i=>i.url));
              const prune=(node:RichNode):RichNode=>({...node,...(node.content?{content:node.content.filter(n=>n.type!=="image"||urls.has(n.attrs?.src||"")).map(prune)}:{})});
              setPost(p=>({...p,images,bodyDocument:prune(p.bodyDocument!)}));setDirty(true);
            }else update(key,value);
          }}/></details>
          <div className="save-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => save("draft")}
              disabled={busy || uploading}
            >
              <Save size={15} /> 임시저장
            </button>
            <button className="primary-button" disabled={busy || uploading}>
              {busy ? "저장 중…" : post.status === "published" ? "수정 내용 저장" : "발행하기"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPreview(!preview)}
            >
              {preview ? "미리보기 닫기" : "본문 미리보기"}
            </button>
            {post.status === "published" && !dirty && (
              <Link
                href={`/articles/${post.id}`}
                target="_blank"
                className="secondary-button"
              >
                글 보기 <ExternalLink size={14} />
              </Link>
            )}
          </div>
          </fieldset>
          <div className={`form-status ${error ? "error" : ""}`} role="status">
            {message ||
              (dirty ? "아직 저장하지 않은 변경 사항이 있습니다." : "")}
          </div>
          {preview && (
            <section className="preview-body">
              <h2>{post.title || "제목 없음"}</h2>
              <p>{post.excerpt}</p>
              <ArticleContent post={post} />
            </section>
          )}
        </form>
      </div>
    </>
  );
}
