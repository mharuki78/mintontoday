import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Minton Today — 오늘도, 배드민턴.",
    template: "%s | Minton Today",
  },
  description:
    "코트 안팎, 배드민턴의 모든 이야기. 레슨과 장비, 동호인 라이프와 공식 뉴스 출처를 만나는 배드민턴 전문 매거진.",
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Minton Today — 오늘도, 배드민턴.",
    description: "당신의 일상에 배드민턴 한 페이지.",
    locale: "ko_KR",
    type: "website",
    images: ["/images/badminton.png"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main">
          본문으로 바로가기
        </a>
        {children}
      </body>
    </html>
  );
}
