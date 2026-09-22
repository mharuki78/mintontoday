import { Header, Footer } from "@/components/site";
import { Login, Editor } from "@/components/admin";
import { isAdmin } from "@/lib/auth";
import { allArticles } from "@/lib/store";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "운영자 공간",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  const authenticated = await isAdmin();
  return (
    <>
      <Header />
      <main id="main" className="wrap admin-shell">
        {authenticated ? (
          <>
            <h1>이야기를 쓰는 공간</h1>
            <p className="admin-help">
              직접 쓴 글과 출처가 분명한 소식으로 Minton Today를 채워 주세요.
            </p>
            <Editor initial={await allArticles()} />
          </>
        ) : (
          <Login />
        )}
      </main>
      <Footer />
    </>
  );
}
