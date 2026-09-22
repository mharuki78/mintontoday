# Minton Today

배드민턴 전문 블로그·뉴스 큐레이션 사이트. 오하클과 분리된 독립 Next.js 프로젝트입니다.

## 실행

Node.js 22 이상(권장 24)에서 `npm ci`, `npm run dev`를 실행한 뒤 http://localhost:3000 에 접속합니다. `npm run build`로 배포 빌드를 검증하고 `npm start`로 실행합니다.

`.env.example`을 `.env.local`로 복사하여 `ADMIN_PASSWORD`(최초 로그인용 비밀번호), `SESSION_SECRET`(32자 이상의 난수), 실제 `SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`을 설정합니다. 환경 파일은 Git에 포함되지 않습니다. 최초 설정 이후 비밀번호는 `/admin`의 **비밀번호 변경**에서 관리합니다.

## 운영

- `/admin`에서 비밀번호로 로그인 → 예시 글 선택 또는 새 글 작성 → 본문 편집 → 임시저장/발행.
- 상단 **비밀번호 변경** → 현재 비밀번호, 새 비밀번호, 새 비밀번호 확인 → 저장. 8~256자이며 특수문자·대문자 조합을 강제하지 않습니다. 다른 기기의 기존 세션은 무효화되고 변경한 기기는 새 세션으로 계속 작업합니다.
- 본문 소제목은 `## 제목`, 문단은 빈 줄로 구분합니다. HTML은 실행되지 않습니다.
- 출처는 HTTPS URL과 이름을 함께 입력합니다. 해외 기사는 한국어 요약으로 전하며 전문 복제하지 않습니다.
- 예시 표시를 해제하기 전에 내용과 사용 권한을 검토하세요. 예시 글은 noindex이며 sitemap에서 제외됩니다.
- 글 저장(북마크)은 독자 브라우저에만 남습니다. 회원가입·댓글·메일 발송 기능은 없습니다.
- 삭제 대신 임시저장으로 전환해 공개 목록에서 내릴 수 있습니다.

## 저장과 배포 조건

## 아침 콘텐츠 운영

`EDITORIAL.md`에 매일 오전 9시(한국 시간) Codex 예약의 편집·검증·게시 절차를 기록했습니다. 로컬 PC와 Codex가 실행 가능한 상태여야 하며 9시는 작업 시작 시각입니다. 블로그 하루 총 2편을 세 카테고리에서 순환하고, 뉴스 및 국가대표/서울·경기 동호인 대회는 변경 사항이 있을 때 발행·갱신합니다.

`node scripts/editorial-publish.mjs snapshot production output/editorial/production-snapshot.json`으로 DB 현황을 읽습니다. 콘텐츠 배치는 `content/YYYY-MM-DD.json`이며 validate 및 publish 명령에서 같은 파일을 사용합니다. 실제 쓰기는 `publish production <file> --apply`로만 수행합니다. 기존 자동화 글의 업데이트에는 snapshot hash가 필요하고 운영자가 관리자에서 저장한 글은 자동화가 덮어쓰지 않습니다. 본문·사진·대회 정보는 관리자에서도 편집할 수 있습니다.

`node --test tests/editorial.test.mjs`로 발행 분량·사진·출처·지역 제한을 확인합니다. 기존 예시 글은 DB에 보존하며 실제 원고가 발행되면 공개 목록에서 제외합니다.

## 데이터베이스

Vercel에서는 `DATABASE_URL`로 연결한 전용 Neon Postgres에 글을 영구 저장합니다. Drizzle 스키마는 `db/schema.ts`, 버전 관리된 마이그레이션은 `db/migrations`입니다. 저장은 글 ID 기준의 원자적 upsert로 처리하므로 서로 다른 글의 동시 편집이 다른 글을 덮어쓰지 않습니다. 같은 글을 동시에 편집하면 마지막 저장이 적용됩니다.

`DATABASE_URL` 없는 로컬 개발은 기존 `CONTENT_DIR/posts.json` 파일 저장을 유지합니다. Vercel에서 데이터베이스 설정이 없으면 파일로 조용히 전환하지 않고 오류로 처리합니다.

환경 변수를 불러온 상태에서 `npm run db:migrate`, `npm run db:seed` 순서로 초기화합니다. Seed는 로컬 저장 글 또는 예시 원고를 가져오며 기존 DB 글을 덮어쓰지 않습니다. 배포 빌드에서는 마이그레이션을 자동 실행하지 않습니다.

Vercel 프로젝트: `himawari5/mintontoday`. GitHub: `mharuki78/mintontoday`. 정식 운영 주소는 https://mintontoday.com 이며 `main` 브랜치가 Production에 연결되어 있습니다. Preview와 Production은 각각 별도의 무료 Neon 데이터베이스를 사용합니다. Production에는 관리자 인증 설정과 정식 SITE_URL을 등록했습니다. Preview의 SITE_URL은 Vercel 배포 URL로 자동 설정됩니다.

로그인은 httpOnly, sameSite=strict, 8시간 만료 서명 쿠키를 사용합니다. 프로덕션에서는 HTTPS가 필요합니다. 변형 요청은 동일 Origin과 세션을 모두 검사합니다. DB 환경의 로그인 시도 제한은 서버 인스턴스 간 공유되며, 운영자 전체에 대해 분당 10회입니다. DB 장애 시 로그인은 503으로 차단합니다. 로컬 파일 모드만 메모리 제한을 사용합니다.

관리자 비밀번호 변경은 기존 비밀번호 확인과 같은 시도 제한을 적용합니다. `admin_credentials`에는 무작위 salt를 사용한 scrypt 해시(N=131072, r=8, p=1), 세션 버전, 변경 시각만 저장합니다. 비밀번호 원문은 저장·응답·로그에 포함하지 않습니다. 최초 변경 전에는 기존 `ADMIN_PASSWORD`와 기존 서명 세션을 지원하지만, 변경 후에는 저장된 해시만 사용하며 이전 비밀번호와 모든 이전 세션은 사용할 수 없습니다. DB 장애·잘못된 레코드가 있으면 환경 비밀번호로 우회하지 않습니다. 재배포해도 새 비밀번호를 유지합니다. DB 없는 로컬 환경은 Git에서 제외된 `CONTENT_DIR/admin-credentials.json`에 저장합니다.

비밀번호 분실 시 환경 변수만 바꿔서는 초기화되지 않습니다. 인증한 운영자가 별도 복구 작업으로 새 scrypt 해시와 새 세션 버전을 원자적으로 저장해야 합니다. 운영 자격 증명 행을 지워 환경 비밀번호로 되돌리는 방식은 사용하지 마세요.

## AdSense 준비

홈 사이드바와 글 상세 사이드바에 광고 예약 영역이 있고 `components/ad-unit.tsx`에 동의 여부를 명시적으로 전달하는 광고 컴포넌트가 준비되어 있습니다. 현재는 광고 네트워크에 요청하지 않습니다.

1. 도메인·HTTPS·운영자 연락처를 설정하고 개인정보 처리방침을 실제 호스팅 및 광고 처리 내용으로 확정합니다.
2. 예시 콘텐츠를 검토한 원본 콘텐츠로 바꾸고 이용자의 탐색과 출처 표기를 점검합니다.
3. AdSense 심사 및 광고 계정 설정을 완료합니다. 코드 준비가 승인을 보장하지 않습니다.
4. 해당하는 동의 관리(CMP)를 연결하고, 승인받은 `NEXT_PUBLIC_ADSENSE_CLIENT` 및 광고 슬롯을 설정합니다.
5. 예약 영역을 `AdUnit`으로 교체하고 CMP에서 받은 `consentGranted`를 전달합니다. 동의 없이 true로 하드코딩하지 마세요.
6. `/ads.txt`, 광고 레이블, 모바일 레이아웃 및 실제 광고 로딩을 확인합니다.

공식 기준: https://support.google.com/adsense/answer/7299563

## 구성

홈, 카테고리/검색 목록, 글 상세, 글 저장/링크 복사, 소개, 문의, 편집 원칙, 개발 단계 개인정보 안내, 관리자 편집기, robots.txt, sitemap.xml, 조건부 ads.txt.

## 검증

`npm run typecheck`, `npm run build`. 개발 서버 실행 후 `npm test`로 초기 예시 데이터 기준 공개 경로, 검색, 404, 비인증/외부 Origin 요청 차단을 검사합니다. 개발 데이터에서만 `RUN_ADMIN_TESTS=1`로 실행하면 `.env.local`의 로컬 비밀번호로 임시저장 → 비공개 확인 → 기존 글 복원도 검사합니다. 운영 서버를 대상으로 실행하지 마세요. 데이터는 백업한 뒤 테스트하세요.

`node --test tests/admin-password.test.mjs`로 비밀번호 정책·해시·세션 폐기를 검사합니다. 빌드 후 `node scripts/test-admin-password.mjs`는 별도 로컬 서버와 임시 저장소를 만들어 변경·재로그인·이전 세션 차단·재시작 후 지속성을 검증합니다. `--preview`는 별도 Preview DB에 자격 증명이 없을 때만 실행하며 테스트가 만든 행만 정리합니다. Production 환경은 지원하지 않습니다.

2026-09-22 의존성 점검: 운영 의존성 취약점 0개. 전체 감사의 중간 등급 4개는 drizzle-kit의 개발용 esbuild 종속 경로이며 esbuild 개발 서버는 실행하지 않습니다. 제안된 강제 다운그레이드는 적용하지 않았고 2026-10-22 또는 drizzle-kit 갱신 때 다시 확인합니다.

## 디자인 자산

`public/logo.svg`: 이번 프로젝트에서 제작한 셔틀콕/M 심벌.
`public/images/badminton.png`: 사용자 지정 참고 프로젝트 `C:/project/ohacle/site/public/badminton.png`의 기존 이미지. 원본 생성 프롬프트는 제공되지 않았으며 새로 생성한 이미지라고 주장하지 않습니다.
글 대표 이미지는 CSS 색면과 SVG 라켓·코트·점수판으로 작성된 기하 그래픽입니다. 서체는 Google Fonts의 Noto Sans KR 및 DM Sans입니다.
