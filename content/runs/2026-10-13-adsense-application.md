# AdSense 계정 연결 및 심사 신청

- 실행일: 2026-10-13, 한국 시간.
- 사용자 요청: 기존 계정 연결부터 신청까지 진행.
- Google AdSense의 `baekhyunjin@gmail.com` 계정에서 비활성 상태를 재활성화하고 `mintontoday.com` 등록.
- 공개 게시자 ID: `pub-9783991407242334`. Google에서 제공한 메타 태그와 ads.txt를 적용. 비밀 인증 정보는 소스·기록에 저장하지 않음.
- 코드 커밋: `12f2de0bf99234c79532f816cc85460d7e969a26`.
- Vercel Production: `dpl_3xJhkhRjvPDbBrFRwwPQ4QYZaZpM`, READY. 실제 도메인 `/`, `/contact`, `/ads.txt` 200과 정확한 확인 값 검증.
- 관련 코드만 포함한 복사본에서 Next.js webpack 빌드·TypeScript 성공. 실행 중인 로컬 서버에서 head 태그, ads.txt, 기존 검색 소유 확인 태그 유지 및 광고 스크립트 미활성 확인.
- Google 소유 확인 성공 화면을 확인한 뒤 ‘검토 요청’ 제출.
- 최종 화면: ‘사이트의 광고 게재 가능 여부 검토 중’, ‘모든 단계를 완료했습니다’, 사이트 `mintontoday.com`.
- 증빙: 로컬 `output/adsense/review-submitted-20261013.png` (Git 미포함).
- 광고 게재 승인 완료가 아님. 광고 활성화 전에는 실제 광고 설정과 해당 지역 인증 CMP를 별도로 구성.
- 일일 콘텐츠 발행 수량 및 자동화 변경 없음. 다른 미커밋 UI/해시태그 변경은 포함하지 않음.
