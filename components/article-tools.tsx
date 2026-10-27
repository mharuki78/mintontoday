"use client";
import { Bookmark, Check, Link as LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { bookmarkKey, readBookmarks } from "@/lib/bookmarks";
export default function ArticleTools({ id, title, category }: { id: string; title: string; category: string }) {
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      setSaved(readBookmarks(localStorage.getItem("minton-bookmarks"),localStorage.getItem(bookmarkKey)).some(p=>p.id===id));
    } catch {}
  }, [id]);
  function toggle() {
    try {
      const old = readBookmarks(localStorage.getItem("minton-bookmarks"),localStorage.getItem(bookmarkKey));
      const exists = old.some(p=>p.id===id);
      const next = exists ? old.filter(p=>p.id!==id) : [...old,{id,title,category}];
      localStorage.setItem(bookmarkKey,JSON.stringify(next));
      localStorage.setItem("minton-bookmarks",JSON.stringify(next.map(p=>p.id)));
      setSaved(!exists);
      setMessage(
        exists ? "저장을 해제했습니다." : "이 기기에 글을 저장했습니다.",
      );
    } catch {
      setMessage("브라우저 저장 공간을 사용할 수 없습니다.");
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      setMessage("링크를 복사했습니다.");
    } catch {
      setMessage("주소창의 링크를 복사해 주세요.");
    }
  }
  return (
    <div className="article-tools">
      <button onClick={toggle} aria-pressed={saved}>
        {saved ? <Check size={16} /> : <Bookmark size={16} />}{" "}
        {saved ? "저장됨" : "글 저장"}
      </button>
      <Link href="/saved">저장한 글</Link>
      <button onClick={share}>
        <LinkIcon size={16} /> 링크 복사
      </button>
      <span role="status">{message}</span>
    </div>
  );
}
