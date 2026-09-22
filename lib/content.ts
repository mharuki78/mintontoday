import { z } from "zod";

export const categories = [
  "레슨 & 가이드",
  "장비 이야기",
  "코트 라이프",
  "뉴스",
  "대회",
] as const;
const httpsUrl = z.string().url().refine((v) => v.startsWith("https://"), "HTTPS 주소가 필요합니다.");
export const tournamentTypes = ["국가대표 대회", "국내 동호인 대회"] as const;
export const sourceSchema = z.object({ name: z.string().min(1).max(160), url: httpsUrl });
export const imageSchema = z.object({
  url: httpsUrl.or(z.string().regex(/^\/images\/[a-zA-Z0-9/_.-]+$/)),
  alt: z.string().min(3).max(300),
  caption: z.string().max(500),
  credit: z.string().min(1).max(200),
  sourceUrl: httpsUrl,
  rights: z.string().min(3).max(500),
  kind: z.enum(["photo", "poster", "illustration"]),
  generated: z.boolean().optional(),
  licenseName: z.string().max(80).optional(),
  licenseUrl: httpsUrl.optional(),
});
export const articleSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(100),
  title: z.string().trim().min(3).max(140),
  category: z.preprocess(v => v === "뉴스 & 대회" ? "코트 라이프" : v, z.enum(categories)),
  excerpt: z.string().trim().min(10).max(300),
  body: z.string().trim().min(40).max(60000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seriesDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  newsDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["draft", "published"]),
  sample: z.boolean().default(false),
  art: z.enum(["court", "racket", "shuttle", "bag", "footwork", "score"]),
  sourceUrl: z
    .string()
    .url()
    .refine((v) => v.startsWith("https://"))
    .or(z.literal(""))
    .default(""),
  sourceName: z.string().max(100).default(""),
  sources: z.array(sourceSchema).max(20).optional(),
  images: z.array(imageSchema).max(12).optional(),
  editorialNote: z.string().max(1000).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
  managedBy: z.literal("daily-editor").optional(),
  event: z.object({
    type: z.enum(tournamentTypes),
    region: z.enum(["해외", "전국", "서울", "경기"]),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    venue: z.string().max(200),
    registration: z.string().max(500),
    status: z.enum(["예정", "접수 중", "진행 중", "종료", "취소", "확인 중"]),
    result: z.string().max(3000),
    url: httpsUrl,
    checkedAt: z.string().datetime({ offset: true }),
  }).optional(),
}).superRefine((post, ctx) => {
  if (post.status !== "published" || post.sample) return;
  const fail = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
  if (post.category === "레슨 & 가이드" && post.body.replace(/\s/g, "").length < 2000)
    fail("body", "레슨 글은 공백을 제외한 본문 2,000자 이상이어야 합니다.");
  if (post.category === "장비 이야기" && new Set(post.images?.filter(i => i.kind === "photo").map(i => i.url)).size < 2)
    fail("images", "장비 글에는 출처를 기록한 서로 다른 사진 2장 이상이 필요합니다.");
  if ((post.category === "뉴스" || post.category === "대회") && !post.sourceUrl && !post.sources?.length)
    fail("sources", "뉴스와 대회 글에는 원문 출처가 필요합니다.");
  if (post.category === "대회" && !post.event) fail("event", "대회 정보가 필요합니다.");
  if (post.event?.type === "국내 동호인 대회" && !["서울", "경기"].includes(post.event.region))
    fail("event", "동호인 대회는 서울·경기 지역으로 제한합니다.");
  if (post.event?.startDate && post.event.endDate && post.event.startDate > post.event.endDate)
    fail("event", "대회 종료일은 시작일보다 빠를 수 없습니다.");
});
export type Article = z.infer<typeof articleSchema>;
export const koreaDate = (now = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
export const upcomingAmateur = (post: Article, today = koreaDate()) =>
  post.event?.type === "국내 동호인 대회" && !!post.event.startDate && post.event.startDate >= today && !["취소", "종료"].includes(post.event.status);
export const readingTime = (body: string) =>
  Math.max(2, Math.ceil(body.length / 600));
export const seeds: Article[] = [
  {
    id: "first-racket",
    title: "나에게 맞는 첫 라켓, 어디서부터 고를까?",
    category: "장비 이야기",
    excerpt:
      "무게부터 밸런스, 그립까지. 숫자보다 먼저 알아야 할 내 손에 맞는 라켓의 기준.",
    art: "racket",
    date: "2026-09-22",
    status: "published",
    sample: true,
    sourceUrl: "",
    sourceName: "",
    body: "처음 배드민턴 라켓을 고를 때는 모델명보다 내 손에 어떤 느낌으로 들어오는지부터 살펴보세요. 같은 무게라도 중심이 어디에 있는지에 따라 스윙의 느낌은 달라집니다. 이 글은 사이트 구성을 보여 주는 편집 예시이며, 실제 제품 사용 후기는 아닙니다.\n\n## 먼저, 빌려서 쳐 보세요\n매장에서 잠깐 쥐어 보는 것과 코트에서 셔틀을 주고받는 것은 다릅니다. 가능하다면 동호회나 레슨에서 여러 라켓을 빌려 짧게 랠리를 해 보세요. 스윙 후 준비 자세로 돌아오기 편한지, 손잡이가 자꾸 돌아가지는 않는지 기록해 두면 선택에 도움이 됩니다.\n\n## 무게와 밸런스는 함께 보기\n가벼운 라켓이 누구에게나 편한 것은 아닙니다. 헤드 쪽에 무게가 모인 라켓과 손잡이 쪽이 편안한 라켓은 같은 총무게라도 다르게 느껴집니다. 제조사마다 표기와 측정 조건이 다를 수 있으니, 제품 설명을 확인하고 실제 사용 감각과 함께 비교하세요.\n\n## 손에 맞는 그립부터\n손잡이를 너무 두껍게 감으면 손가락을 쓰기 어렵고, 너무 얇으면 불필요하게 힘을 주게 될 수 있습니다. 처음에는 편하게 쥐었다 풀 수 있는 두께를 찾아보세요. 그립 테이프는 교체할 수 있으니 라켓 자체와 분리해서 생각해도 좋습니다.\n\n## 첫 구매 전 체크리스트\n예산 안에서 라켓과 스트링, 그립을 함께 준비할 수 있는지 확인하세요. 스트링 장력은 제조사의 권장 범위를 지키고, 처음부터 높은 장력을 목표로 하기보다 코치나 스트링 작업자와 자신의 경험 수준을 상의하는 편이 좋습니다.\n\n좋은 첫 라켓은 가장 비싼 라켓보다 다음 운동에도 자연스럽게 손이 가는 라켓입니다. 모델 이름보다 직접 느낀 장단점을 메모해 두세요.",
  },
  {
    id: "ready-position",
    title: "잘 치는 사람은, 기다리는 자세부터 다르다",
    category: "레슨 & 가이드",
    excerpt:
      "셔틀이 오기 전의 짧은 순간. 다음 한 걸음을 가볍게 만드는 준비 자세를 살펴봅니다.",
    art: "footwork",
    date: "2026-09-21",
    status: "published",
    sample: true,
    sourceUrl: "",
    sourceName: "",
    body: "배드민턴에서는 셔틀을 치는 순간만큼 다음 동작을 준비하는 시간도 중요합니다. 이 글은 운영자가 다듬어 발행할 수 있는 레슨 예시 원고입니다.\n\n## 내 동작이 끝난 뒤를 관찰하기\n연습 영상을 볼 때 타구 순간만 보지 말고 바로 다음 장면을 멈춰 보세요. 라켓이 아래로 떨어져 있는지, 발이 멈춰 있는지, 상대와 셔틀을 계속 보고 있는지 살펴볼 수 있습니다.\n\n## 편안하게 움직일 수 있는 자세\n무릎을 무조건 깊게 굽히기보다 어느 방향으로든 움직일 수 있는 편안한 높이를 찾는 것이 출발점입니다. 발 간격과 상체 각도는 상황과 개인에 따라 달라집니다. 한 자세를 고정해 버리기보다 코치에게 실제 움직임을 보여 주고 조정하세요.\n\n## 한 번에 한 가지만 연습하기\n오늘의 목표를 “타구 뒤 라켓을 다시 준비하기”처럼 하나로 정해 보세요. 짧은 랠리에서 같은 목표를 반복한 뒤 파트너에게 어떻게 보였는지 물어보면 좋습니다. 여러 교정 사항을 동시에 떠올리는 것보다 변화를 알아차리기 쉽습니다.\n\n## 결과보다 회복 동작\n셔틀이 네트를 넘었는지만 평가하지 말고, 다음 공을 받을 여유가 있었는지도 기록하세요. 준비 자세의 목적은 멋진 모양을 만드는 것이 아니라 다음 선택을 할 시간을 확보하는 것입니다.",
  },
  {
    id: "first-club-day",
    title: "처음 동호회에 가는 날, 가방에 담을 것들",
    category: "코트 라이프",
    excerpt:
      "운동화 한 켤레와 작은 용기. 첫 모임을 편하게 만드는 준비물과 코트 매너.",
    art: "bag",
    date: "2026-09-20",
    status: "published",
    sample: true,
    sourceUrl: "",
    sourceName: "",
    body: "처음 가는 체육관은 입구를 찾는 순간부터 낯설 수 있습니다. 준비물을 모두 완벽하게 갖추는 것보다 모임 담당자에게 운영 방식을 미리 묻는 일이 도움이 됩니다. 아래는 첫 방문 안내를 위한 예시 원고입니다.\n\n## 출발 전에 물어볼 것\n방문 가능한 시간, 참가비, 주차와 탈의실 이용 여부를 확인하세요. 라켓을 빌릴 수 있는지, 셔틀콕을 개인이 준비하는지도 모임마다 다릅니다. 초보자 참여가 가능한 시간인지 먼저 확인하면 서로 편합니다.\n\n## 가방에는 기본부터\n실내 전용 운동화, 물, 수건, 갈아입을 옷을 챙기세요. 외부에서 신었던 신발은 코트 바닥을 더럽히거나 미끄럽게 만들 수 있으니 실내화 규정을 지킵니다. 개인 라켓이 있다면 스트링과 그립 상태도 확인해 두세요.\n\n## 코트에 들어갈 때\n진행 중인 랠리 뒤로 갑자기 지나가지 말고 공이 멈출 때까지 기다리세요. 다른 코트로 셔틀이 넘어갔다면 상대가 인지하도록 알리고 안전한 때 회수합니다. 처음 만난 파트너에게는 자신의 경험을 짧게 알려 주세요.\n\n## 첫날의 목표는 다시 오고 싶은 마음\n경기 결과보다 편하게 인사한 사람과 배운 한 가지를 기억해 보세요. 모임마다 분위기와 방식이 다르므로 한 번의 방문만으로 자신과 배드민턴이 맞지 않는다고 결론낼 필요는 없습니다.",
  },
  {
    id: "shuttle-care",
    title: "셔틀콕 한 통, 조금 더 오래 함께하는 법",
    category: "장비 이야기",
    excerpt:
      "보관과 사용 순서만 바꿔도 달라지는 컨디션. 셔틀콕을 다루는 작은 습관.",
    art: "shuttle",
    date: "2026-09-19",
    status: "published",
    sample: true,
    sourceUrl: "",
    sourceName: "",
    body: "셔틀콕은 같은 통 안에 있어도 사용 상태에 따라 비행이 달라질 수 있습니다. 새 셔틀과 연습용 셔틀을 구분하는 작은 습관부터 시작해 보세요. 이 글은 예시 편집 원고입니다.\n\n## 사용한 셔틀은 따로 모으기\n깃털이 조금 손상된 셔틀을 바로 버리기보다 어떤 연습에 쓸 수 있는지 확인하세요. 일정한 비행이 필요한 경기와 반복 타구 연습은 요구 조건이 다릅니다. 형태가 크게 무너진 셔틀은 예측하기 어려우니 구분해 둡니다.\n\n## 보관은 제조사 안내를 우선으로\n습도나 온도에 관한 관리 방법은 제품 소재에 따라 다를 수 있습니다. 임의로 물이나 증기를 사용하는 방법을 모든 제품에 적용하지 말고, 포장에 적힌 보관 안내를 확인하세요. 차량 안처럼 온도가 크게 변하는 곳에 오래 두는 일도 피하는 편이 좋습니다.\n\n## 다음 사람을 위한 정리\n연습이 끝나면 코트에 떨어진 깃털과 셔틀을 모아 주세요. 사용할 수 있는 셔틀은 연습용 통에, 파손된 것은 시설 분리배출 기준에 맞게 정리합니다. 작은 정리가 다음 랠리를 편하게 만듭니다.",
  },
  {
    id: "watch-badminton",
    title: "배드민턴 경기를 더 재미있게 보는 세 가지 시선",
    category: "코트 라이프",
    excerpt:
      "셔틀만 따라가던 관전에서 한 걸음 더. 빈 공간과 파트너의 움직임을 읽어 보세요.",
    art: "score",
    date: "2026-09-18",
    status: "published",
    sample: true,
    sourceUrl: "https://bwfbadminton.com/",
    sourceName: "BWF 공식 홈페이지",
    body: "빠르게 오가는 셔틀을 따라가다 보면 한 랠리가 어느새 끝나 있습니다. 다음 경기를 볼 때는 승패와 별개로 관찰 대상을 하나씩 정해 보세요. 이 글은 최신 경기 결과를 보도하는 기사가 아닌 관전 가이드 예시입니다.\n\n## 셔틀이 없는 공간\n선수가 셔틀을 보낸 위치뿐 아니라 그 타구로 상대가 어디로 움직였는지 살펴보세요. 앞쪽과 뒤쪽을 번갈아 사용하는 흐름, 한쪽으로 몰린 뒤 반대편에 생기는 공간이 보이기 시작합니다.\n\n## 복식 파트너의 다음 자리\n한 선수가 공격하는 동안 파트너는 어디에 서 있는지 관찰해 보세요. 두 선수의 위치는 상황에 따라 계속 바뀝니다. 한 장면을 정답처럼 외우기보다 여러 랠리에서 어떤 선택이 반복되는지 보는 것이 좋습니다.\n\n## 득점 직전의 한두 타구\n마지막 스매시만 보지 말고 그 전에 어떤 타구가 기회를 만들었는지 되돌려 보세요. 수비를 벗어나는 타구나 상대를 네트 앞으로 부르는 타구가 공격의 시작일 수 있습니다.\n\n대회 일정과 공식 소식은 아래 BWF 원문 링크에서 확인할 수 있습니다. 사이트의 뉴스 모음은 원문을 대신하지 않으며, 출처를 함께 제공합니다.",
  },
  {
    id: "practice-journal",
    title: "오늘의 한 게임을, 내일의 실력으로",
    category: "코트 라이프",
    excerpt:
      "잘된 타구 하나, 아쉬운 선택 하나. 짧은 운동 기록을 시작하는 방법.",
    art: "court",
    date: "2026-09-17",
    status: "published",
    sample: true,
    sourceUrl: "",
    sourceName: "",
    body: "운동을 마치고 남기는 두세 줄은 다음 연습의 방향을 정하는 데 도움이 됩니다. 자세한 경기 분석을 매번 해야 하는 것은 아닙니다. 이 글은 운동 기록에 관한 예시 원고입니다.\n\n## 잘된 장면 하나\n오늘 가장 만족스러웠던 장면을 구체적으로 적어 보세요. 단순히 “잘했다”보다 “짧은 서브 뒤 라켓을 준비해서 다음 공을 받을 수 있었다”처럼 행동을 남기는 편이 다시 떠올리기 쉽습니다.\n\n## 다시 해 보고 싶은 선택 하나\n실수를 나열하기보다 다음에 시도할 행동을 기록하세요. 상대를 탓하거나 결과만 평가하기보다 자신이 선택할 수 있었던 부분에 집중합니다.\n\n## 다음 운동에서 확인하기\n이전 기록을 한 번 읽고 연습 목표를 하나 정합니다. 반복되는 문제가 있다면 기록이나 영상을 코치에게 보여 주세요. 혼자 같은 교정을 반복하기보다 실제 피드백을 받는 것이 도움이 될 수 있습니다.",
  },
];
