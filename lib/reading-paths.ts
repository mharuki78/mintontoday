export const beginnerPath = [
  { id: "lesson-first-month-practice-plan", title: "첫 레슨 준비하기", detail: "준비물과 첫 달의 연습 순서" },
  { id: "lesson-grip-switching", title: "포핸드와 백핸드 그립 익히기", detail: "늦는 수비를 그립 전환부터 점검하기" },
  { id: "lesson-short-serve-and-return", title: "짧은 서브 연습하기", detail: "목표 구역을 정하는 30분 연습" },
];

export const categoryDescriptions: Record<string, string> = {
  "레슨 & 가이드": "어디서 막히는지 찾고, 다음 연습에서 바꿔 볼 한 가지를 정합니다. 그립·서브·풋워크를 연습 순서와 관찰 기준으로 풀어냅니다.",
  "장비 이야기": "라켓의 무게와 밸런스, 셔틀의 비행, 가방의 수납을 비교합니다. 제조사 사양과 공개 사용 후기를 구분해 구매 전에 따져 볼 차이를 정리합니다.",
  "코트 라이프": "파트너와의 약속, 동호회 운영, 점수와 코트 라인. 함께 운동하다 생기는 구체적인 문제를 다룹니다.",
  "뉴스": "한국 선수와 세계 배드민턴의 경기·발표·인터뷰를 전합니다. 사건이 일어난 날짜와 경기 결과를 원문 출처와 함께 기록합니다.",
  "대회": "국제대회의 일정과 한국 선수 결과, 서울·경기 동호인 대회의 장소와 접수 정보를 대회별 고정 글에 모읍니다.",
};

export const categoryPaths: Record<string, { id: string; title: string }[]> = {
  "레슨 & 가이드": beginnerPath,
  "장비 이야기": [
    { id: "gear-yonex-as30-mavis350", title: "연습용 셔틀: 깃털과 나일론" },
    { id: "gear-yonex-65z3-vs-65z4-shoes-20260924", title: "배드민턴화: 65Z 세대 비교" },
    { id: "gear-yonex-ba02626-expert-bag-20261019", title: "가방: 분리 수납이 필요한 경우" },
  ],
  "코트 라이프": [
    { id: "court-first-visit-etiquette", title: "동호회 첫 방문 전에" },
    { id: "court-doubles-service-order-20261015", title: "복식 서브 순서가 헷갈릴 때" },
    { id: "court-singles-doubles-boundary-lines-20261016", title: "단식·복식 코트 라인 읽기" },
  ],
};
