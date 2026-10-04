# 2026-10-05 오후 추가 자동화 실행 기록

## 날짜와 수량

`minton-today-10-7`의 heartbeat 시각은 2026-10-04T18:02:08.601Z, 한국 시간 10월 5일 03:02였다. 실제 작업 시작 시계는 한국 시간 10월 5일 06:30을 반환했다. 현재 날짜가 추가 업데이트 기간 안에 있고 운영 DB에 당일 블로그가 없어 10월 5일 누락분 2편을 채웠다. 소급 발행하지 않았으며 다음 오전·오후 실행도 당일 수량을 다시 조회해야 한다. 오전 기록은 덮어쓰지 않았다.

이전 실행에서 저장한 오후 예약은 `DTSTART;TZID=Asia/Seoul:20261004T180000` 및 매일 18:00, `UNTIL=20261007T090000Z`를 유지하고 있다. 도구와 저장된 설정을 조회했지만 이번 heartbeat도 예정한 한국 시간 18:00과 달랐다. 실제 예약 시각 문제가 해결됐다고 판단하지 않았고 추측으로 규칙을 다시 바꾸지 않았다. 오전 9시 자동화는 수정하지 않았다. 10월 8일 이후 오후 자동화 중지 조건은 유지한다.

## 발행과 뉴스 갱신

- `lesson-doubles-short-serve-push-return-20261005`: 「복식 리시브가 자꾸 뜬다면: 짧은 서브를 옆 공간으로 밀어 받는 연습」. 공백 제외 2,030자. 짧은 서브를 받다가 뜨거나 길어지는 문제에서 출발해 중간 공간, 짧은 스윙, 같은 서브에서 오류를 나누는 연습과 다음 공 준비를 설명했다. 기존 서브·드라이브·클리어 글과 구별했다.
- `gear-lining-axforce80-4u-20261005`: 「리닝 AXFORCE 80 4U 리뷰: 힘을 보내기 쉬워도 타이밍은 따로 맞춰야 한다」. 공백 제외 2,185자. 검은색 기존 AXFORCE 80 4U 모델의 사양, 공개 사용 후기와 독자의 비교 시타 조건을 다뤘다. 80 II·80 J·Light 제품과 섞지 않았다.
- 두 블로그에 관련 태그 5개씩 저장했다. 10월 3일 레슨·코트, 4일 장비·코트, 5일 레슨·장비로 최근 3일 각 카테고리 2편을 맞췄다. 과거 1회 추가 발행 요청을 반복하지 않았다.
- 기존 `news-korea-badminton-homecoming-20261001`을 갱신했다. 엑스포츠뉴스의 10월 5일 보도에 귀속해 안세영이 4일 전국체전 단체전 8강 두 번째 단식에서 서보현을 꺾었고 삼성생명이 준결승에 올랐다는 내용을 반영했다. 전날 미출전 문단은 유지하고 소제목과 요약을 실제 후속 소식에 맞췄다. 전체 공백 제외 1,869자. 원래 발행일·newsDate와 기존 자료사진은 유지했으며 같은 사건을 새 기사로 중복 발행하지 않았다.

## 자료와 편집

EDITORIAL.md, 현재 스키마와 publisher를 읽고 using-superpowers, verification-before-completion, humanizer, imagegen, Vercel 배포·브라우저 지침을 적용했다. 본문은 구체적인 문제와 조건을 설명하는 문단으로 썼고 작업 설명·중복 주석은 넣지 않았다. 장비의 비사용 안내는 본문 끝 한 문장만 남겼다.

레슨은 Badminton Insight의 공개 리시브 설명 본문을 읽어 준비 자세·짧은 스윙·그립 대응을 간단히 귀속했다. Badminton Bible에서는 공개 도입부의 중간 공간 설명만 사용했고 구독 영상·본문은 읽거나 시청한 것처럼 쓰지 않았다. 기록 방법과 단계별 연습 구성은 편집부 제안이다. 효과를 실험한 것처럼 표현하거나 보편적인 횟수·각도를 처방하지 않았다.

장비는 Li-Ning Europe의 검은색 4U `AYPT271-4` 제품에서 Medium·G5·675mm·그립 길이 200mm를 확인했다. Li-Ning Scandinavia의 같은 기존 모델 안내에서 헤드헤비·6.6mm·4U 80~84g 범위를 확인했다. 이 범위를 줄과 그립이 포함된 실측 무게로 쓰지 않았다. CK Yew의 2022년 실제 4U 비교 리뷰는 쉬운 힘 전달과 탄력, 반복 사용에서도 맞지 않았던 타이밍을 짧게 귀속했다. 개인 취향을 모두에게 보장되는 성능으로 바꾸지 않았으며 리뷰의 사진·평점·문장을 복제하지 않았다. 원고 대부분은 현재 라켓과 같은 조건으로 비교하는 독창적인 설명이다. 출처별 요약은 200단어 이하로 제한했다.

안세영 기사 원문은 일반 브라우저에서 읽었다. 대한체육회 개별 결과표를 확인하지 못해 기사에 나온 게임별 점수와 팀 점수는 옮기지 않았다. 언론 보도라는 귀속을 유지하고 직접 취재·인터뷰한 것처럼 표현하지 않았다. 추측성 심리·휴식·부상 해설도 추가하지 않았다.

## 사진

- `/images/editorial/axforce80-2-20261005.webp`, `/images/editorial/axforce80-3-20261005.webp`: Li-Ning Scandinavia 공개 제품 페이지의 프레임·연결부와 샤프트 표기 사진 2장. 구조·배색·모델 구별에 연결한 제한 인용으로 사용했다. 출처·원본 URL·크레딧·사용 근거·변환 내역을 글과 `content/assets`에 저장했으며 포괄적 사용 허가를 주장하지 않았다. 두 사진을 직접 시각 확인했다.
- `/images/editorial/serve-return-practice-20261005.webp`: 성인 동호인의 복식 리시브 연습 장면을 내장 image_gen으로 생성하고 라켓·인물·장면을 시각 확인했다. 1,440px WebP로 변환했으며 캡션에 AI 일러스트를 표시했다. 실제 선수·대회 사진으로 소개하지 않았다. 최종 메타데이터에는 실제 생성 프롬프트 전체를 기록했다.
- 기존 `/images/editorial/an-taipei-2019-02.webp`의 자료사진·저자·라이선스 표기를 유지했다. 언론 사진은 복제하지 않았다.

## 대회 조사

빅터·요넥스 루키 머니컵 주최 공문, 아틱 조직위원회 뉴스, 덴마크·프랑스 공식 일정, 통일로스포츠연맹 공지를 다시 조회했다. 머니컵의 개최일·이의신청 기한·연락 기한·대진표 예정일 등은 이미 반영된 내용과 같았으며 새로 확인된 변경이 없어 글과 수정일을 바꾸지 않았다. 아틱의 경기별 결과·시간을 추가 검증하지 못해 확정하지 않았다. 검색 요약이나 예상 명단만으로 새로운 대회 글을 만들지 않았다.

## 실제 게시와 검증

- 최초와 게시 직전 Production snapshot 모두 99건, 당일 공개 블로그 0편. 신규 ID 부재와 기존 뉴스의 daily-editor 관리 주체·expectedHash `28d067d10163948898da80d3ebb1fdc1` 일치를 확인했다. 수동 편집 글을 덮어쓰지 않았다.
- `validate production content/2026-10-05-afternoon.json`으로 3건 스키마·분량·출처·실물 사진 2장 검증 성공.
- 이미지 자산 커밋 `08ce21ea73b267044d6910643ab40a6c6d85f795`에 대응하는 Production 배포 `dpl_DKpJGoVmNrvW71t7xHGSeJWnPV8K`가 READY인 것을 확인했다. 새 이미지 3개와 기존 안세영 사진의 실주소 HTTP 200을 확인한 뒤 게시했다.
- `publish production content/2026-10-05-afternoon.json --apply`: written 3, skipped 0, 운영 DB 재검증 성공. 게시 후 총 101건, 10월 5일 공개 블로그 정확히 2편.
- 공개 글 3개 모두 HTTP 200, 제목·첫 문단·끝 문단 일치, DB와 배치 본문 일치, 사이트맵 URL 포함을 확인했다. 결과는 ignored `output/editorial/live-checks-20261005.json`에 저장했다.
- 실제 브라우저에서 장비 사진 2장과 레슨 사진의 자연 크기 1,440px 로드를 확인했다. 아래 장비 사진은 해당 위치로 스크롤한 뒤 지연 로딩을 확인했다. 세션 `minton-editorial-20261005`를 종료했다.
- 관련 자산·콘텐츠·실행 기록만 GitHub에 기록한다. 다른 사용자 작업 파일은 보존했으며 콘텐츠 작업에 전체 앱 빌드를 반복하지 않았다.

## 주요 출처

- [Badminton Insight · 복식 리시브](https://badminton-insight.com/how-to-return-the-serve-in-doubles/)
- [Badminton Bible · 공개 푸시 설명](https://www.badmintonbible.com/shots/serve-and-return/serve-return/low/basic-push)
- [Li-Ning Europe · 검은색 AXFORCE 80 4U](https://www.li-ning.de/en/products/badmintonschl-ger-axforce-80-4u-schwarz-unbespannt-aypt271-4-ayps004-2)
- [Li-Ning Scandinavia · 사양과 제품 사진](https://li-ningfamily.com/products/li-ning-axforce-80)
- [CK Yew · 2022년 직접 사용 비교](https://www.ckyew.com/post/li-ning-tectonic-9-axforce-80-aeronaut-9000c-review)
- [엑스포츠뉴스 · 안세영 전국체전 첫 승](https://www.xportsnews.com/article/2204178)
- [빅터 머니컵 공문](https://www.badmintonfriends.co.kr/3b37e695-4f78-813f-b1a1-d56478f7e172), [루키 머니컵 공문](https://www.badmintonfriends.co.kr/3b37e695-4f78-81a8-8db9-d4b50f7e9918)
- [아틱 뉴스](https://www.arcticopen.fi/news/), [덴마크 공식](https://denmarkopen.dk/), [프랑스 프로그램](https://www.yonexifb.com/fr/la-competition/programme), [통일로 공지](https://www.tong1ro.com/competition/notice.php)
