# 2026-10-27 AdSense 반려 후 유지보수

사용자 요청: 사이트 전체 정비. 사용자 선택: 기존 글 전부 공개·기존 주소 유지.

- 기준 snapshot: output/editorial/adsense-20261027-before.json (157행, 실기사151·샘플6).
- 본문 검토151편, 수정85편, 유지66편. ID·발행일·공개 상태·출처·사진 메타데이터 보존.
- 배치: content/2026-10-27-adsense-maintenance.json. 검토 이유: content/audits/2026-10-27-adsense.json.
- `validate production … --maintenance` 통과 후 `publish production … --maintenance --apply` 실행.
- Production written85 / skipped0. DB readback 검증 및 Public cache invalidated 확인.
- 결과를 확인하지 못한 아시안게임 남자단체의 모순 문장은 삭제하고 정정 메모 유지. 대체 기록을 추정하지 않음.
- 오늘 오전 자동 발행 파일과 기록을 변경하지 않음. 일일 수량·예약도 변경하지 않음.
- 외부 원문·사진 권리 전체를 재검증한 작업은 아님. 기술·UI·신청 후속 증거는 docs/adsense-readiness.md에 기록.
