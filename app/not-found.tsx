import { Header, Footer } from "@/components/site";
import Link from "next/link";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="wrap empty">
        <h1>이 이야기를 찾을 수 없어요.</h1>
        <p>주소가 바뀌었거나 아직 공개되지 않은 글입니다.</p>
        <Link href="/articles" className="primary-button">
          이야기 목록으로
        </Link>
      </main>
      <Footer />
    </>
  );
}
