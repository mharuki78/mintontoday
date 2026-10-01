"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import styles from "./shuttle-flight.module.css";

const airPaths = [
  "M 830 565 C 650 460 548 405 502 324 S 324 102 -110 -100",
  "M 852 630 C 652 518 554 462 468 412 S 194 282 -130 66",
  "M 814 692 C 648 616 560 562 480 513 S 244 422 -122 200",
  "M 816 431 C 672 346 564 226 458 171 S 204 60 -110 -138",
];

export function ShuttleFlight() {
  const frame = useRef<HTMLDivElement>(null);
  const preference = useRef<boolean | null>(null);
  const syncPlayback = useRef<() => void>(() => {});
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const gradientId = useId();

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    const sync = () => {
      const active = (preference.current ?? !reducedMotion.matches) && inView && !document.hidden;
      if (active) setStarted(true);
      setPlaying(active);
    };
    syncPlayback.current = sync;
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: 0.1 });
    observer.observe(element);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      syncPlayback.current = () => {};
    };
  }, []);

  return (
    <div ref={frame} className={`hero-image ${styles.frame}`} data-playing={playing} data-started={started}>
      <div className={styles.scene}>
        <div className={styles.flight}>
          <svg className={styles.air} viewBox="0 0 720 720" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="660" y1="540" x2="50" y2="140" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="0.35" stopColor="white" stopOpacity="0.95" />
                <stop offset="0.75" stopColor="#6caaa1" stopOpacity="0.45" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2].map(layer => (
              <g key={layer} className={`${styles.current} ${styles[`current${layer}`]}`}>
                {airPaths.map((path, i) => <path key={path} d={path} stroke={`url(#${gradientId})`} strokeWidth={i === 1 ? 2.3 : 1.5} strokeDasharray={i % 2 ? "160 380" : "100 460"} strokeLinecap="round" />)}
              </g>
            ))}
            <g className={styles.dust}>
              <circle cx="580" cy="580" r="1.3" fill="white" />
              <circle cx="440" cy="210" r="1.6" fill="white" />
              <circle cx="216" cy="480" r="1.1" fill="white" />
              <circle cx="654" cy="385" r="1.2" fill="white" />
              <circle cx="290" cy="116" r="1.4" fill="white" />
            </g>
          </svg>
          <div className={styles.shuttle}>
            {/* Generated product visual; provenance is recorded in content/assets. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/shuttle-flight.webp" width={960} height={960} alt="화면 밖에서 들어와 천천히 떨어지는 셔틀콕" fetchPriority="high" decoding="async" />
        </div>
        <svg className={styles.foreground} viewBox="0 0 720 720" fill="none" aria-hidden="true">
          <path className={styles.wake} d="M 764 618 C 620 574 527 530 444 478 C 307 391 208 406 -94 240" stroke="white" strokeOpacity="0.28" strokeWidth="1" />
        </svg>
        </div>
      </div>
      <button type="button" className={styles.control} aria-label={playing ? "애니메이션 일시정지" : "애니메이션 재생"} onClick={() => {
        preference.current = !playing;
        syncPlayback.current();
      }}>
        {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
      </button>
    </div>
  );
}
