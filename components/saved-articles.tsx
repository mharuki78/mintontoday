"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bookmarkKey, readBookmarks, type BookmarkEntry } from "@/lib/bookmarks";

export default function SavedArticles() {
  const [posts,setPosts] = useState<BookmarkEntry[] | null>(null);
  const [error,setError] = useState("");
  useEffect(()=>{
    const load=()=>{try {setPosts(readBookmarks(localStorage.getItem("minton-bookmarks"),localStorage.getItem(bookmarkKey)));} catch {setPosts([]);setError("브라우저 저장 공간을 사용할 수 없습니다.");}};
    load(); window.addEventListener("storage",load);
    return ()=>window.removeEventListener("storage",load);
  },[]);
  function remove(id:string) {
    try {
      const current=readBookmarks(localStorage.getItem("minton-bookmarks"),localStorage.getItem(bookmarkKey)).filter(p=>p.id!==id);
      localStorage.setItem(bookmarkKey,JSON.stringify(current));
      localStorage.setItem("minton-bookmarks",JSON.stringify(current.map(p=>p.id)));setPosts(current);
    } catch {setError("저장을 해제하지 못했습니다. 브라우저 저장 설정을 확인해 주세요.");}
  }
  return <><p role="status">{error || (posts === null ? "저장한 글을 불러오고 있습니다." : `${posts.length}편을 저장했습니다.`)}</p>{posts?.length ? <ul className="saved-list">{posts.map(p=><li key={p.id}><Link href={`/articles/${p.id}`}><small>{p.category || "이전에 저장한 글"}</small><strong>{p.title || p.id}</strong></Link><button onClick={()=>remove(p.id)} aria-label={`${p.title || p.id} 저장 해제`}>저장 해제</button></li>)}</ul> : posts && <div className="empty"><h2>다시 읽고 싶은 글을 모아보세요.</h2><p>각 글의 ‘글 저장’을 누르면 여기에 모입니다.</p><Link className="primary-button" href="/articles">이야기 둘러보기</Link></div>}</>;
}
