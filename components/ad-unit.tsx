"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
/** Mount only after the publisher has configured consent and updated the privacy policy. */
export default function AdUnit({
  consentGranted,
  slot,
}: {
  consentGranted: boolean;
  slot: string;
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const [ready, setReady] = useState(false);
  const pushed = useRef(false);
  const valid =
    !!client && /^ca-pub-\d{16}$/.test(client) && /^\d+$/.test(slot);
  useEffect(() => {
    if (!consentGranted || !valid || !ready || pushed.current) return;
    try {
      const w = window as unknown as { adsbygoogle: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* Keep reserved space if blocked. */
    }
  }, [consentGranted, valid, ready]);
  if (!consentGranted || !valid) return null;
  return (
    <aside aria-label="광고" style={{ minHeight: 250 }}>
      <small>광고</small>
      <Script
        id="adsense"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
