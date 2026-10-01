"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import styles from "./hero-video.module.css";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const applyPlayback = useRef<() => void>(() => {});
  const preference = useRef<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    let disposed = false;
    const sync = () => {
      const wantsPlayback = preference.current ?? !reducedMotion.matches;
      if (wantsPlayback && inView && !document.hidden) {
        void video.play().catch(() => { if (!disposed) setPlaying(false); });
      } else {
        video.pause();
      }
    };
    applyPlayback.current = sync;
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: 0.1 });
    observer.observe(video);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    video.addEventListener("loadeddata", sync);
    sync();
    return () => {
      disposed = true;
      observer.disconnect();
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("loadeddata", sync);
      applyPlayback.current = () => {};
      video.pause();
    };
  }, []);

  return (
    <div className={`hero-image ${styles.frame}`}>
      <video
        ref={videoRef}
        className={styles.video}
        src="/videos/badminton-smash.mp4"
        poster="/images/badminton-smash-poster.webp"
        width={720}
        height={720}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="배드민턴 오버헤드 타구를 담은 실사 슬로모션"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => { setFailed(true); setPlaying(false); }}
      >
        배드민턴 오버헤드 타구를 담은 실사 슬로모션 영상입니다.
      </video>
      {!failed && <button
        type="button"
        className={styles.control}
        aria-label={playing ? "영상 일시정지" : "영상 재생"}
        onClick={() => {
          preference.current = !playing;
          applyPlayback.current();
        }}
      >
        {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
      </button>}
    </div>
  );
}
