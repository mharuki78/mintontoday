"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import styles from "./shuttle-flight.module.css";

const flightDuration = 16000;
const wakeCount = 56;
const wakeLanes = [-28, -9, 9, 28];

function flightPose(offset: number, width: number, height: number) {
  const time = offset * 1.2;
  const dx = 1.64 * width;
  const dy = (6 * time - 3) * height;
  const speed = Math.hypot(dx, dy);
  return {
    x: (-0.5 + 1.64 * time) * width,
    y: (1.03 - 3 * time + 3 * time * time) * height,
    ux: dx / speed,
    uy: dy / speed,
    angle: Math.atan2(dy, dx) * 180 / Math.PI - 45,
  };
}

function flightKeyframes(width: number, height: number) {
  const position: Keyframe[] = [];
  const heading: Keyframe[] = [];
  for (let i = 0; i <= 120; i++) {
    const offset = i / 120;
    const pose = flightPose(offset, width, height);
    const opacity = Math.max(0, Math.min(1, offset / 0.08, (1 - offset) / 0.1));
    position.push({ offset, opacity, transform: `translate(${(pose.x / width - 0.5) * 100}%, ${(pose.y / height - 0.5) * 100}%)` });
    heading.push({ offset, transform: `translate(-50%, -50%) rotate(${pose.angle}deg)` });
  }
  return { position, heading };
}

function wakeEmission(index: number) {
  return 0.13 + index / (wakeCount - 1) * 0.69;
}

function wakePath(emission: number, lane: number, width: number, height: number) {
  const size = Math.min(width * 0.62, 240);
  const points = Array.from({ length: 8 }, (_, i) => {
    const offset = emission - 0.038 + i / 7 * 0.038;
    const pose = flightPose(offset, width, height);
    const spread = (lane + Math.sin(offset * 48 + lane * 0.1) * 4) * size / 240;
    // Emit behind the feather skirt, then leave the wake in scene coordinates.
    return {
      x: pose.x - pose.ux * size * 0.46 - pose.uy * spread,
      y: pose.y - pose.uy * size * 0.46 + pose.ux * spread,
    };
  });
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    const next = points[i + 1];
    path += ` Q ${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`;
  }
  const last = points[points.length - 1];
  return `${path} T ${last.x} ${last.y}`;
}

function wakeKeyframes(index: number, width: number, height: number): Keyframe[] {
  const emission = wakeEmission(index);
  const pose = flightPose(emission, width, height);
  const sway = Math.sin(index * 0.25) * 8;
  const drift = `translate(${-pose.ux * 9 - pose.uy * sway}px, ${-pose.uy * 9 + pose.ux * sway}px)`;
  return [
    { offset: 0, opacity: 0, transform: "translate(0, 0)" },
    { offset: emission, opacity: 0, transform: "translate(0, 0)" },
    { offset: emission + 0.014, opacity: 0.65, transform: "translate(0, 0)" },
    { offset: emission + 0.065, opacity: 0.45 },
    { offset: emission + 0.16, opacity: 0, transform: drift },
    { offset: 1, opacity: 0, transform: drift },
  ];
}

export function ShuttleFlight() {
  const frame = useRef<HTMLDivElement>(null);
  const flight = useRef<HTMLDivElement>(null);
  const shuttle = useRef<HTMLDivElement>(null);
  const wake = useRef<SVGSVGElement>(null);
  const preference = useRef<boolean | null>(null);
  const syncPlayback = useRef<() => void>(() => {});
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = frame.current;
    const flightElement = flight.current;
    const shuttleElement = shuttle.current;
    const wakeElement = wake.current;
    if (!element || !flightElement || !shuttleElement || !wakeElement) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const packets = Array.from(wakeElement.querySelectorAll<SVGGElement>("[data-wake-packet]"));
    let inView = true;
    let animations: Animation[] = [];
    const measure = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      wakeElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
      packets.forEach((packet, index) => {
        packet.querySelectorAll("path").forEach((path, lane) => {
          path.setAttribute("d", wakePath(wakeEmission(index), wakeLanes[lane] ?? 0, width, height));
        });
      });
      return { width, height };
    };
    const sync = () => {
      const active = (preference.current ?? !reducedMotion.matches) && inView && !document.hidden;
      if (active) {
        if (!animations.length) {
          const { width, height } = measure();
          const keys = flightKeyframes(width, height);
          const timing = { duration: flightDuration, iterations: Infinity, easing: "linear" };
          animations = [
            flightElement.animate(keys.position, timing),
            shuttleElement.animate(keys.heading, timing),
            ...packets.map((packet, index) => packet.animate(wakeKeyframes(index, width, height), timing)),
          ];
          const startTime = document.timeline.currentTime;
          animations.forEach(animation => { animation.startTime = startTime; });
        } else {
          animations.forEach(animation => animation.play());
        }
      } else {
        animations.forEach(animation => animation.pause());
      }
      setPlaying(active);
    };
    syncPlayback.current = sync;
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: 0.1 });
    observer.observe(element);
    const resizeObserver = new ResizeObserver(() => {
      if (!animations.length) return;
      const { width, height } = measure();
      const keys = flightKeyframes(width, height);
      (animations[0].effect as KeyframeEffect).setKeyframes(keys.position);
      (animations[1].effect as KeyframeEffect).setKeyframes(keys.heading);
      packets.forEach((_, index) => {
        (animations[index + 2].effect as KeyframeEffect).setKeyframes(wakeKeyframes(index, width, height));
      });
    });
    resizeObserver.observe(element);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      syncPlayback.current = () => {};
      animations.forEach(animation => animation.cancel());
    };
  }, []);

  return (
    <div ref={frame} className={`hero-image ${styles.frame}`} data-playing={playing}>
      <div className={styles.scene}>
        <svg ref={wake} className={styles.air} fill="none" aria-hidden="true">
          {Array.from({ length: wakeCount }, (_, index) => (
            <g key={index} className={styles.packet} data-wake-packet={index}>
              {wakeLanes.map((lane, i) => <path key={lane} stroke={i % 2 ? "#4c8b80" : "white"} strokeWidth={i % 2 ? 1.7 : 2.7} strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
              <path className={styles.mist} stroke="white" strokeWidth="11" strokeOpacity="0.24" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
        <div ref={flight} className={styles.flight}>
          <div ref={shuttle} className={styles.shuttle}>
            {/* Generated product visual; provenance is recorded in content/assets. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/shuttle-flight.webp" width={960} height={960} alt="화면 밖에서 들어와 포물선을 그리며 천천히 떨어지는 셔틀콕" fetchPriority="high" decoding="async" />
          </div>
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
