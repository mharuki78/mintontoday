"use client";
import { Bookmark, Check, Link as LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
export default function ArticleTools({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      setSaved(
        JSON.parse(localStorage.getItem("minton-bookmarks") || "[]").includes(
          id,
        ),
      );
    } catch {}
  }, [id]);
  function toggle() {
    try {
      const old = JSON.parse(
        localStorage.getItem("minton-bookmarks") || "[]",
      ) as string[];
      localStorage.setItem(
        "minton-bookmarks",
        JSON.stringify(saved ? old.filter((v) => v !== id) : [...old, id]),
      );
      setSaved(!saved);
      setMessage(
        saved ? "저장을 해제했습니다." : "이 기기에 글을 저장했습니다.",
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
      <button onClick={toggle}>
        {saved ? <Check size={16} /> : <Bookmark size={16} />}{" "}
        {saved ? "저장됨" : "글 저장"}
      </button>
      <button onClick={share}>
        <LinkIcon size={16} /> 링크 복사
      </button>
      <span role="status">{message}</span>
    </div>
  );
}
