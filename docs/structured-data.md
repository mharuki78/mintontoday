# Minton Today 구조화 데이터

2026-10-27, Asia/Seoul. 기존 뉴스·블로그의 JSON-LD를 점검하고 사이트 및 발행 주체를 연결했다. 원고·발행일·DB 저장 데이터·공개 상태는 바꾸지 않는다.

## 페이지와 정보의 대응

- 홈: `WebSite`에 실제 이름 Minton Today와 대체 이름 민턴투데이, 한국어, 대표 주소를 표시한다. `Organization`에는 실제 문의메일 baekhyunjin@gmail.com, 편집·정정 원칙과 기존 180×180 PNG 로고를 연결한다. 확인되지 않은 개인 기자·법인명·주소·외부 프로필은 만들지 않는다.
- 공개 글: 뉴스는 `NewsArticle`, 나머지 블로그·대회 안내는 기존 분류대로 `BlogPosting`을 사용한다. 제목·요약·카테고리·주제 태그·원문 출처를 실제 글 데이터에서 가져온다. 안정적인 `@id`로 발행 주체·글·대표 URL·웹페이지·사이트 관계를 연결한다.
- 경로: `BreadcrumbList`는 현재 화면의 홈 링크, 카테고리 목록 링크, 글 제목에 대응한다. 검색·관리자·저장 목록 등에 가짜 기사 정보를 추가하지 않는다.
- 날짜: `datePublished`는 실제 최초 공개일 `date`다. 기사 사건일 `newsDate`나 창간 기획일 `seriesDate`로 대체하지 않는다. 과거 자료에 시각이 없으면 날짜만 쓰며 임의의 자정·오전 9시를 넣지 않는다. `dateModified`는 기록된 `updatedAt`이 있을 때만 쓴다. 구조화 데이터 생성 자체는 수정일을 바꾸지 않는다.
- 사진: 실제 첨부 이미지만 `ImageObject`로 제공한다. 절대 URL·캡션·크레딧을 유지하고, 명시된 `licenseUrl`이 있을 때만 라이선스를 넣는다. 사진이 없으면 로고를 기사 사진으로 대체하지 않는다. 생성 이미지를 실사로 재분류하거나 출처를 사용 허락으로 바꾸지 않는다.

서버에서 이미 읽은 동일 글로 생성하므로 DB 조회·전체 본문 중복 다운로드를 추가하지 않는다. JSON-LD는 서버 HTML의 일반 script 태그로 출력하며 `<`를 이스케이프해 편집한 제목 등이 script 태그를 닫지 못하게 한다. 초안·샘플에는 기사 데이터를 만들지 않는다. 새 라이브러리는 추가하지 않았다.

## 검증

- `tests/structured-data.test.mjs`: 사이트·발행 주체의 일관성, 실제 날짜, 뉴스/블로그 구분, 경로, 사진·라이선스의 누락 처리, 초안·샘플 제외, script 삽입 방어.
- `scripts/test-seo.mjs`: 격리된 로컬 서버에서 실제 HTML을 파싱해 홈·뉴스·블로그 그래프, canonical, robots, RSS·사이트맵을 검사한다. 변경 전 빌드에서는 `Home must emit WebSite identity`로 실패했고 변경 후 빌드에서 통과했다.
- `scripts/test-public-cache.mjs --suite`: 전체 38개 중 37 통과, 소유자 샘플 저장 검사 1개 조건부 생략. 검색·공개 캐시·관리자 API 회귀 검사도 통과했다. Production 빌드와 TypeScript 통과.
- 로컬의 기존 운영 snapshot과 이미 게시한 유지보수 배치를 조합한 오프라인 검토에서도 실제 공개 151편의 그래프를 생성했다. 외부 사진의 크롤링 상태나 Google의 실제 수집 결과를 이 검사만으로 판정한 것은 아니다.

Google 검사 도구·운영 배포의 후속 결과는 실제 확인 뒤 기록한다. 구조화 데이터는 페이지의 의미를 설명하는 보완 정보이며 검색 노출 형태·순위 또는 AdSense 승인을 보장하지 않는다.

## 공식 기준

- [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google 사이트 이름](https://developers.google.com/search/docs/appearance/site-names)
- [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Google BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Google 발행일·수정일](https://developers.google.com/search/docs/appearance/publication-dates)
- [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
