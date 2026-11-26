"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { RotateCcw, Undo2 } from "lucide-react";
import { nextRally, nextService, openingRally, playerInCourt, type Team } from "@/lib/doubles-practice";

export function ServicePractice() {
  const [history, setHistory] = useState([openingRally]);
  const state = history[history.length - 1];
  const { server, receiver, side } = nextService(state);
  const announcement = useRef<HTMLParagraphElement>(null);
  const finished = history.length === 9;

  useEffect(() => {
    const node = announcement.current;
    if (!node || history.length === 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const effect = animate(node, { y: [3, 0], duration: 180, ease: "outQuad" });
    return () => { effect.revert(); };
  }, [history]);

  function score(team: Team) {
    setHistory(h => h.length >= 9 ? h : [...h, nextRally(h[h.length - 1], team)]);
  }
  function position(team: Team, right: boolean) {
    const player = playerInCourt(state, team, right);
    const role = player === server ? "서버" : player === receiver ? "리시버" : "파트너";
    return <div className="practice-position" data-role={role}><b>{player}</b><span>{role}</span></div>;
  }
  return <section id="service-practice" className="practice-panel" aria-labelledby="practice-title">
    <h2 id="practice-title">복식 서브 순서 연습판</h2>
    <p>첫 서버는 A, 첫 리시버는 C입니다. 랠리를 이긴 팀을 누르면 다음 서버와 리시버가 표시됩니다. 여덟 번까지 연습할 수 있습니다.</p>
    <div className="practice-score"><span>A·B 팀 <b>{state.points[0]}</b></span><span>C·D 팀 <b>{state.points[1]}</b></span></div>
    <div className="practice-court" aria-label="서비스 코트 배정. 위쪽은 C·D 팀, 아래쪽은 A·B 팀">
      {position(1, true)}{position(1, false)}{position(0, false)}{position(0, true)}
    </div>
    <p className="practice-call" aria-live="polite" aria-atomic="true" ref={announcement}>
      {state.points[0]} 대 {state.points[1]} · {server}가 {side}에서 {receiver}에게 서브
    </p>
    <div className="practice-actions"><button type="button" className="btn" disabled={finished} onClick={() => score(0)}>A·B 팀 득점</button><button type="button" className="btn" disabled={finished} onClick={() => score(1)}>C·D 팀 득점</button></div>
    <div className="practice-controls">
      <button type="button" disabled={history.length < 2} onClick={() => setHistory(h => h.length > 1 ? h.slice(0, -1) : h)}><Undo2 size={15}/>한 점 되돌리기</button>
      <button type="button" disabled={history.length < 2} onClick={() => setHistory([openingRally])}><RotateCcw size={15}/>처음부터</button>
    </div>
    <p className="practice-rule">{finished ? "여덟 랠리를 마쳤습니다. " : ""}서브한 팀이 득점하면 그 팀의 두 선수가 좌우를 바꿉니다. 리시브한 팀이 득점하면 자리를 유지한 채 서브권을 가져옵니다. <a href="https://www.badminton.no/contentassets/c0b5fd676d9a4a10bd7a14c673a7bad0/section-4.1---laws-of-badminton---26-april-2025-v5.0-1--1.pdf" target="_blank" rel="noopener noreferrer">BWF 경기 규칙 11조</a></p>
  </section>;
}
