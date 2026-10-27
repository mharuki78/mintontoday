import { Header, Footer } from "@/components/site";
import SavedArticles from "@/components/saved-articles";
export const metadata = {title:"저장한 글",robots:{index:false,follow:true}};
export default function SavedPage() {
  return <><Header/><main id="main" className="wrap info-page"><h1>저장한 글</h1><p>이 브라우저에 저장한 이야기입니다. 다른 기기와 동기화되지 않으며, 사이트 데이터를 삭제하면 저장 목록도 사라집니다.</p><SavedArticles/></main><Footer/></>;
}
