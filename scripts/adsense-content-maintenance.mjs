import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { validateEditorialBatch } from "../lib/publication.ts";

// Offline maintenance only. Publishing and fresh ownership/hash checks remain separate.
const snapshotPath = "output/editorial/adsense-20261027-before.json";
const outputPath = "content/2026-10-27-adsense-maintenance.json";
const reportPath = "output/editorial/adsense-content-audit.json";
const today = "2026-10-27";
const editedAt = process.env.EDITORIAL_MAINTENANCE_AT || new Date().toISOString();
if (Number.isNaN(Date.parse(editedAt))) throw new Error("Invalid maintenance timestamp");
const rows = JSON.parse((await readFile(snapshotPath, "utf8")).replace(/^\uFEFF/, ""));
const report = JSON.parse((await readFile(reportPath, "utf8")).replace(/^\uFEFF/, ""));
const changes = [];
const skipped = [];
const paragraphs = body => body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
const join = parts => parts.filter(Boolean).join("\n\n");
function replaceRequired(post, before, after, label) {
  if (!post.body.includes(before)) throw new Error(`${post.id}: missing expected passage (${label})`);
  post.body = post.body.replace(before, after);
}
function dropStarts(post, starts) {
  const parts = paragraphs(post.body);
  for (const start of starts) {
    const index = parts.findIndex(part => part.startsWith(start));
    if (index < 0) throw new Error(`${post.id}: missing reviewed paragraph ${start}`);
    const replacement = reviewedParagraphReplacements[post.id]?.[start];
    if (replacement) parts[index] = replacement;
    else parts.splice(index, 1);
  }
  post.body = join(parts);
}
function tidyHeadings(body) {
  const parts = paragraphs(body);
  return join(parts.filter((part, index) => !part.startsWith("## ") || (parts[index + 1] && !parts[index + 1].startsWith("## "))));
}
function reviseParagraph(post, prefix, replacement) {
  const parts = paragraphs(post.body);
  const index = parts.findIndex(part => part.startsWith(prefix));
  if (index < 0) throw new Error(`${post.id}: missing reviewed paragraph ${prefix}`);
  parts[index] = replacement;
  post.body = join(parts);
}
const newsDrops = {
  "news-an-china-masters-20260906": ["아시안게임에서는 여자단체와 여자단식이 별도로", "세계선수권과 차이나 마스터스에서 거둔 성적, 미디어데이의 말은"],
  "news-an-se-young-asian-games-20260922": ["여자단체전의 대표팀 결과는 개별 경기의 승패를 합산한다."],
  "news-an-se-young-september-interview": ["당시 인터뷰의 중심에는 특정 상대를 이기겠다는 예측보다"],
  "news-ap-an-se-young-20260917": ["안세영은 국제대회 성적을 바탕으로 아시안게임 개막 전"],
  "news-seo-kim-asian-games-confidence-20260921": ["아시안게임 남자복식은 선수 두 명이 한 조로 출전하는", "9월 21일의 발언에서 두 선수는 준비 과정이 정리됐다는"],
  "news-korea-japan-semifinal-preview-20260923": ["안세영이 먼저 승점을 얻은 뒤에도", "점수만 보면 한국은 첫 경기를 따낸 뒤", "아시안게임 여자단체전은 선수 개인의 단식 순위만", "한국은 직전 아시안게임 여자단체 금메달 팀이었기 때문에", "이번 준결승은 단체전이 단식과 복식의 연속 승점을"],
  "news-indonesia-men-team-asian-games-gold-20260925": ["이번 결승은 여러 명의 선수가 이어서 출전하는", "이번 결승은 다섯 경기 가운데 세 경기를 먼저"],
  "news-korea-doubles-asian-games-opening-20260926": ["스코어가 알려 주는 강점은 각기 다릅니다.", "오늘은 혼합복식의 연승을 확인하는 날이라기보다", "단체전과 개인전은 별도 기록으로 봐야 합니다."],
  "news-korea-four-asian-games-semifinals-20260928": ["개인전 4강은 이미 한국 여자대표팀이 단체전에서 확보한"],
  "news-korea-two-golds-asian-games-20260930": ["이번 개인전에서는 준결승과 결승의 상대를 모두", "여자단체전 동메달을 얻은 한국은 개인전에서 금메달 두 개를 더했다."],
  "news-korea-badminton-homecoming-20261001": ["두 결승의 경기 양상도 달랐다.", "이번 귀국은 끝난 대회의 결과를 국내 팬들과 나누는 자리였다."],
  "news-an-seyoung-pony-chung-young-leader-20261008": ["같은 인터뷰에서 안세영은 지난해보다 나은 선수가 되는 것을 목표로", "올해 시상식은 수요일인 11월 25일로 예정돼 있다."],
};
// Unique factual context is kept even when the surrounding explanation is repetitive.
const reviewedParagraphReplacements = {
  "news-an-china-masters-20260906": {
    "아시안게임에서는 여자단체와 여자단식이 별도로": "안세영은 앞선 항저우 아시안게임에서 여자단체와 여자단식 금메달을 모두 따냈다.",
  },
  "news-korea-four-asian-games-semifinals-20260928": {
    "개인전 4강은 이미 한국 여자대표팀이 단체전에서 확보한": "한국 여자대표팀은 앞서 단체전에서 동메달을 얻었다. 이번 네 대진의 4강 진출은 별도의 개인전 기록이다.",
  },
  "news-an-seyoung-pony-chung-young-leader-20261008": {
    "같은 인터뷰에서 안세영은 지난해보다 나은 선수가 되는 것을 목표로": "안세영은 같은 인터뷰에서 지난해보다 나은 선수가 되는 것을 목표로 삼고 있다고 밝혔다. 매일 최선을 다하다 보면 올림픽 2연패에도 다가갈 수 있다는 취지였다.",
  },
  "news-seo-kim-asian-games-confidence-20260921": {
    "아시안게임 남자복식은 선수 두 명이 한 조로 출전하는": "서승재·김원호는 남자복식 정상이라는 목표를 앞에 두고 준비를 이어 갔다.",
  },
};
const datedTitles = {
  "news-korea-denmark-semifinals-20261017": "안세영·김원호·서승재, 덴마크 오픈 4강 진출…10월 17일 준결승 예고",
  "news-french-open-quarterfinals-20261023": "프랑스오픈 8강 대진: 10월 23일 안세영·24일 새벽 김원호·서승재 경기 예고",
  "news-french-open-an-sindhu-final-20261025": "안세영·신두, 첫판 대신 결승에서…10월 25일 프랑스오픈 결승 예고",
};
const gearPhotoDrops = {
  "gear-lining-axforce70": ["첫 사진에서는 프레임 전체의 색상과 라인, 두 번째 사진에서는"],
  "gear-victor-auraspeed-90k-ii": ["짙은 파란색 계열의 프레임과 그래픽은 전체 인상을"],
  "gear-yonex-pro-bag-92426": ["첫 사진은 다크 그린 색상의 옆면, 두 번째 사진은"],
};
const scopeOnlyGear = new Set(["gear-lining-axforce70", "gear-victor-auraspeed-90k-ii", "gear-yonex-as30-mavis350", "gear-yonex-pro-bag-92426"]);
const noTrialDisclosure = "제품 사양과 공개 자료를 바탕으로 정리했으며 직접 사용한 후기는 아닙니다.";
const commonReviewDisclosure = "제품 사양과 공개 사용 후기를 바탕으로 작성했으며 직접 사용한 후기는 아닙니다.";
const supportedNoChange = {
  "gear-victor-master-ace-20261007": "재독 결과, 2016년과 2022년 시험의 타구감 차이·후기 시점·가상 비용 계산을 구분해 제품별 선택 근거가 있다. 공통 시타 문장이 있다는 이유만으로 보강 필요로 분류한 것은 과도했다. 본문을 보존한다.",
  "gear-victor-br9213-bag-20261001": "재독 결과, 76cm 몸체·6개용과 실제 짐의 관계·오래 멜 때 등 지지의 약점을 구체적으로 연결한다. 다른 가방에도 적용할 조언이 일부 있어도 이 모델의 선택 근거가 충분해 본문을 보존한다.",
};
for (const item of report.articles) if (supportedNoChange[item.id]) {
  item.recommendation = "keep";
  item.reason = supportedNoChange[item.id];
  item.noChangeReview = "Full-body reread: initial broad generic-filler flag was a false positive, not an unresolved required fix.";
}

for (const row of rows) {
  const original = row.data;
  if (original.status !== "published" || original.sample || original.managedBy !== "daily-editor") {
    skipped.push({ id: row.id, reason: "sample, non-public or owner-edited; preserved" });
    continue;
  }
  if (original.bodyDocument) {
    skipped.push({ id: row.id, reason: "rich document requires document-aware editing; preserved" });
    continue;
  }
  const post = structuredClone(original);
  const notes = [];
  const isAmateur = post.event?.type === "국내 동호인 대회";
  const isPastAmateur = isAmateur && post.event.endDate && post.event.endDate < today;
  const templateLead = "이번 안내는 공개된 대회 홍보 포스터를 읽고 필요한 정보를 정리한 참가 준비 노트입니다.";

  if (isAmateur && post.body.includes(templateLead)) {
    const parts = paragraphs(post.body);
    const detailStart = parts.indexOf("## 이 대회를 살펴볼 때");
    const applicationStart = parts.indexOf("## 신청 전에 확인할 것");
    const departureStart = parts.indexOf("## 출발 전 다시 한 번");
    if ([detailStart, applicationStart, departureStart].some(index => index < 0)) throw new Error(`${post.id}: unrecognized amateur template`);
    const specific = parts.slice(detailStart + 1, applicationStart);
    // Retain poster/list conflicts and any dated correction following the shared ending.
    const sharedEnd = "대회가 가까워지면 아래 안내 출처에서 대진표와 경기장 배정을 확인하세요. 개최 전 일정 안내이므로 결과는 아직 없습니다.";
    const tail = parts.slice(departureStart + 1).map(part => part.replace(sharedEnd, "").trim()).filter(Boolean);
    const dateRange = post.event.startDate === post.event.endDate ? post.event.startDate : `${post.event.startDate}~${post.event.endDate}`;
    const introduction = isPastAmateur
      ? `${post.title}의 공개 안내에 적힌 개최 예정 기간은 ${dateRange}, 경기장은 ${post.event.venue}였다. 안내된 기간이 지난 대회의 참가 정보 기록이다. 실제 개최 여부와 경기 결과는 이 글에서 새로 확인하지 않았다.`
      : `${post.title}의 공개 안내 일정은 ${dateRange}, 경기장은 ${post.event.venue}다. 아래는 해당 포스터에 적힌 참가 조건이다.`;
    post.body = join([introduction, "## 당시 공개된 참가 안내".replace("당시 ", isPastAmateur ? "당시 " : ""), ...specific, "## 접수 기준", post.event.registration, ...tail]);
    notes.push("remove shared poster-introduction/application/departure boilerplate; preserve event-specific facts");
  }

  if (isPastAmateur) {
    if (!original.body.includes(templateLead)) {
      const archive = `공개 안내에 적힌 개최 예정 기간(${post.event.startDate}~${post.event.endDate})이 지난 대회의 참가 정보 기록이다. 아래 내용은 당시 공지 기준이며, 실제 개최 여부와 경기 결과는 새로 확인하지 않았다.`;
      post.body = join([archive, post.body]);
      post.body = post.body.replaceAll("현재는 개최 전으로 경기결과가 없으며", "당시에는 개최 전 안내였으며")
        .replaceAll("이 글은 개최 전 일정 안내이며 경기 결과는 아직 없다.", "당시 공지는 경기 결과를 포함하지 않았다.");
    }
    // An elapsed advertised date is not independent evidence the event actually took place.
    if (["예정", "접수 중", "진행 중"].includes(post.event.status)) post.event.status = "확인 중";
    if (/개최 전|결과 없음|결과 미확인/.test(post.event.result)) post.event.result = "안내된 개최 기간 경과 · 실제 개최 여부와 경기 결과 미확인";
    post.excerpt = `${post.event.startDate}~${post.event.endDate} 예정으로 안내됐던 ${post.event.venue} 대회의 참가 정보 기록입니다. 경기 결과는 새로 확인하지 않았습니다.`;
    notes.push("distinguish elapsed advertised schedule from verified event completion/result");
  }

  if (post.id === "amateur-2026-668") {
    replaceRequired(post, "신청 기한은 10월 25일 오후 5시지만 600팀 선착순 모집이므로, 날짜만 보고 남은 자리가 있다고 생각해서는 안 된다.", "공개 요강의 신청 기한은 10월 25일 오후 5시로 이미 지났다. 모집 규모는 600팀 선착순이었다. 연장·추가 접수 여부는 새로 확인되지 않았으므로 현재 신청 가능한 대회로 안내하지 않는다.", "expired HOENG deadline");
    if (post.event.status === "접수 중") post.event.status = "예정";
    post.event.registration = "공개 요강상 2026-10-25 17시 신청 기한 경과. 연장·추가 접수 여부는 주최 측 확인 필요.";
    notes.push("make expired application deadline explicit without assuming extra intake");
  }

  if (newsDrops[post.id]) {
    dropStarts(post, newsDrops[post.id]);
    notes.push("remove specifically reviewed duplicated score explanation/editorial filler");
  }
  if (datedTitles[post.id]) { post.title = datedTitles[post.id]; notes.push("replace relative today headline with explicit historical preview date"); }
  if (post.id === "news-korea-denmark-semifinals-20261017") post.body = post.body.replace("이날 덴마크 오덴세", "10월 17일 덴마크 오덴세");
  if (post.id === "news-french-open-quarterfinals-20261023") post.body = post.body.replace("한국 시간으로는 이날 오후 4시 30분이다.", "당시 배정된 한국 시간은 10월 23일 오후 4시 30분이었다.");
  if (post.id === "news-french-open-an-sindhu-final-20261025") replaceRequired(post,
    "결승은 25일 오후 7시 한국 시간으로 프랑스 트랑블레앙프랑스의 아레나 그랑 파리에서 열린다.",
    "당시 예고된 결승 시각은 10월 25일 한국 시간 오후 7시였고, 장소는 프랑스 트랑블레앙프랑스의 아레나 그랑 파리였다.",
    "dated French final preview");
  if (post.id === "news-korea-japan-semifinal-preview-20260923") {
    const parts = paragraphs(post.body);
    const index = parts.findIndex(part => part.startsWith("일본은 9월 24일 중국과 여자단체 결승을 치른다."));
    if (index < 0) throw new Error("Missing reviewed Japan future fixture paragraph");
    parts[index] = "준결승 당시 다음 일정은 9월 24일 여자단체 중국-일본 결승 오전 9시 30분, 남자단체 인도네시아-중국 결승 오후 4시로 예고됐다. 이 기사의 한국 여자대표팀 1-3 패배는 9월 23일 준결승 결과다.";
    post.body = join(parts);
    post.editorialNote = [post.editorialNote, "당시 9월 24일 오전 9시 37분 조회에 남은 여자단체 결승 0-0은 진행 중 점수였으며 최종 결과가 아닙니다."].filter(Boolean).join(" ");
  }
  if (post.id === "news-an-se-young-september-interview") post.body = post.body.replace("안세영이 2026년 9월 8일", "당시 세계 1위 안세영이 2026년 9월 8일");
  if (post.id === "news-an-seyoung-pony-chung-young-leader-20261008") post.body = post.body.replace("11월 25일 서울 삼성동", "11월 25일 수요일 서울 삼성동");

  if (post.id === "tournament-asian-games-2026") {
    dropStarts(post, ["남자대표팀은 전날 8강에서 중국에 2–3으로 패했다."]);
    post.editorialNote = [post.editorialNote, "2026.10.27 정정: 남자단체 8강의 팀 점수와 세부 승자 수가 맞지 않는 문장을 삭제했습니다. 해당 결과는 원문 재확인 전 확정해 적지 않습니다."].filter(Boolean).join(" ");
    notes.push("remove internally contradictory men's team result; retain concise correction and unresolved status");
  }
  if (post.id === "tournament-arctic-open-2026") { post.body = post.body.replace("두 선수는 다음 주 오덴세의 덴마크 오픈으로 향한다.", "당시 두 선수의 다음 대회는 오덴세의 덴마크 오픈으로 안내됐다."); notes.push("date-scope expired next-week preview"); }
  if (post.id === "tournament-denmark-open-2026") { post.body = post.body.replace("다음 대회인 프랑스 오픈은 20~25일 Arena Grand Paris에서 열린다.", "당시 다음 일정으로 안내된 프랑스 오픈의 개최 기간은 10월 20~25일, 장소는 Arena Grand Paris였다."); notes.push("date-scope subsequent tournament preview"); }
  if (post.id === "tournament-hylo-open-2026") {
    const scope = "한국 선수의 최종 출전 명단과 개인별 대진은 아직 확인되지 않았다.";
    replaceRequired(post, scope + " ", "", "HYLO Korean-entry scope");
    const parts = paragraphs(post.body);
    parts[0] += " " + scope;
    post.body = join(parts);
    post.excerpt = "10월 27일~11월 1일 자르브뤼켄 HYLO Open의 한국 시간별 세션과 주요 대진 안내입니다. 한국 선수 최종 출전 명단은 미확인 상태입니다.";
    notes.push("move existing unconfirmed Korean-entry scope into lead/excerpt; no new entry or result claims");
  }

  if (post.id === "court-court-boundary-safety-20260926") {
    replaceRequired(post, "옆 코트 선수들이 랠리를 이어 가는 중이라면 그들이 공을 치고 난 직후에 들어가겠다고 손짓해도 늦지 않습니다. 셔틀이 발 앞에 떨어졌다면 급히 허리를 숙여 줍기보다 상대가 타구를 마칠 때까지 자리를 비켜 주세요.", "셔틀이 선수의 발 앞이나 이동 경로에 떨어졌다면 정지 신호를 보내 랠리를 멈추게 합니다. 모두가 멈춘 것을 확인한 뒤 가까운 한 사람이 회수합니다. 급히 허리를 숙이거나 다음 타구를 기다리며 셔틀을 피해 뛰지 않습니다.", "danger retrieval sequence");
    notes.push("make danger-stop-retrieve order consistent");
  }
  if (post.id === "court-racket-collision-response-20261025") {
    replaceRequired(post, "겉으로 멀쩡해 보여도 라켓이 부딪혔다면 게임이 끝난 뒤 한 번은 상태를 살펴야 한다.", "겉으로 멀쩡해 보여도 라켓이 부딪힌 뒤에는 플레이를 멈추고 상태를 살펴야 한다. 손상이 의심되면 그 라켓의 사용을 중단한다.", "collision stop timing");
    notes.push("remove delay-until-after-game ambiguity");
  }

  if (post.id === "court-doubles-partner-calls-20260927") {
    dropStarts(post, ["긴 문장을 외치면 셔틀이 바닥에 닿기 전에", "콜은 셔틀 판단과 파트너 지시를 구분해야 합니다."]);
    post.title = "복식 가운데 공이 비는 이유: 공격·수비 전환 때 두 사람의 위치 맞추기";
    post.excerpt = "공격과 수비가 바뀔 때 가운데가 비거나 두 사람이 겹치는 장면을 살펴봅니다. 주손과 타점, 파트너의 준비에 맞춰 담당을 조정하는 방법입니다.";
    post.body = post.body.replace("가운데 셔틀의 기본 담당, 공격·수비 때 돌아갈 위치, 짧은 콜 세 가지", "가운데 셔틀의 기본 담당과 공격·수비 때 돌아갈 위치").replace("가운데 공의 기본 담당, 공격·수비 때 돌아갈 위치, 짧은 콜 세 가지", "가운데 공의 기본 담당과 공격·수비 때 돌아갈 위치");
    post.body = post.body.replace("## 짧고 구분되는 콜을 쓴다", "");
    post.body = post.body.replace("세 가지 기준을 30초만 확인하고", "담당과 위치 기준을 30초만 확인하고");
    notes.push("focus overlapping partner guide on center responsibility and positional transitions; keep URL");
  }
  if (post.id === "court-doubles-communication-calls-20260924") {
    post.title = "복식 콜은 언제 해야 할까? 파트너가 판단할 시간을 주는 짧은 신호";
    post.excerpt = "가운데 공을 맡겠다는 말이 타구 뒤에 나오면 파트너도 멈추기 어렵습니다. 콜의 시점과 표현을 맞추고, 들리지 않았던 장면을 짧게 복기하는 방법을 정리했습니다.";
    dropStarts(post, ["두 사람의 위치가 계속 바뀌는 랠리에서는", "서로 익숙해도 매번 판단이 같지는 않습니다."]);
    notes.push("focus calls guide on timing, wording and missed communication");
  }

  if (gearPhotoDrops[post.id]) {
    dropStarts(post, gearPhotoDrops[post.id]);
    // Preserve the concrete visible color facts while dropping the photo-as-review framing.
    const color = { "gear-lining-axforce70": "AXForce 70은 어두운 바탕의 프레임과 그래픽을 사용한다.", "gear-victor-auraspeed-90k-ii": "90K II는 짙은 파란색 계열의 프레임과 그래픽을 사용한다. WES2.0과 ANTI-TORSION SYSTEM은 제조사의 기술 설명이며, 실제 체감이나 측정 결과와 구분해 읽는다.", "gear-yonex-pro-bag-92426": "여기서 살펴본 BAG92426은 다크 그린 색상이며, 긴 라켓형 몸체와 손잡이, 두 어깨끈을 갖췄다." }[post.id];
    const productParts = paragraphs(post.body);
    productParts.splice(1, 0, color);
    post.body = join(productParts);
    notes.push("remove picture-orientation padding while retaining visible product identity");
  }
  if (scopeOnlyGear.has(post.id)) {
    post.body = post.body.replace(commonReviewDisclosure, noTrialDisclosure);
    notes.push("align closing disclosure with limited public-material scope");
  }
  if (post.id === "gear-victor-ryuga-ii-review-20260927") { post.title = "빅터 RYUGA II J 사양과 RYUGA II 공개 시타기: 버전을 나눠 읽는 선택 기준"; notes.push("scope title to actual specification/reviewer version mismatch"); }
  if (post.id === "gear-lining-halbertec-9000-power-20260925") {
    const start = post.body.indexOf("\n\n## 시타 후 비교를 기록하는 방법");
    if (start < 0) throw new Error("Missing reviewed Halbertec appendix");
    // G5/G6 options and grip considerations already appear before this repeated appendix.
    post.body = post.body.slice(0, start).trim();
    notes.push("remove repeated post-conclusion trial/grip appendix");
  }
  if (post.id === "gear-yonex-65z3-vs-65z4-shoes-20260924") {
    post.body = post.body.replace("민턴투데이가 두 모델을 직접 신어 테스트한 리뷰는 아닙니다. ", "");
    post.body = post.body.replace("이 비교는 공식 사양과 공개된 직접 착화 후기를 바탕으로 정리했습니다. ", "");
    notes.push("remove duplicate usage-scope explanation before closing disclosure");
  }

  if (post.id === "lesson-net-lift-depth-20260929") {
    const before = "파트너가 앞에 서 있다면 깊이 보내는 선택이 유용하고, 상대 뒤 코트에 여유가 없으면 단순히 높게 뜬 셔틀만 돌려주는 것이 오히려 부담이 될 수 있습니다.";
    const after = "상대가 앞에 서 있다면 깊이 보내 시간을 벌 수 있습니다. 다만 높이만 뜨고 길이가 짧다면 상대가 후위에서 편하게 공격할 수 있으므로, 높이와 깊이를 함께 평가합니다.";
    replaceRequired(post, before, after, "ambiguous lift choice");
    notes.push("clarify lift height/depth decision using facts already explained in the article");
  }
  if (post.id === "lesson-split-step-timing-20260925") {
    replaceRequired(post, "신호를 정해 두면 혼자 할 때보다 상대의 타구를 기다리는 감각을 만들기 좋습니다.", "이 소리 신호는 준비 동작을 익히는 기초 연습입니다. 실제 랠리에서는 이어지는 단계처럼 상대 라켓과 셔틀을 보고 타이밍을 맞춥니다.", "signal precursor scope");
    notes.push("distinguish sound-signal precursor from actual visual racket timing");
  }

  if (post.id === "amateur-2026-666") {
    reviseParagraph(post, "원본 요강의 접수확인·이의신청 기간은", "원본 요강에 안내된 접수확인·이의신청 기간은 10월 22일부터 23일 오후 6시까지로 이미 지났다. 신청 정보의 오류나 이후 변경은 소속 클럽을 통해 협회의 후속 안내를 확인한다. 신청 기한 이후 취소·환불 제한도 있으므로 참가 여부가 달라졌다면 클럽 담당자와 협회에 먼저 알려야 한다.");
    notes.push("distinguish expired roster-review stage from current participant follow-up");
  }
  if (post.id === "amateur-2026-686") {
    reviseParagraph(post, "대표자회의는 10월 24일", "요강에 적힌 대표자회의 예정은 10월 24일 토요일 오후 6시, 협회 사무실이었다. 종목별 참가자 명단 확인·정정과 운영 사항을 다루는 자리로 안내됐다. 실제 회의 진행과 후속 변경 공지는 소속 클럽을 통해 확인해야 한다. 별도의 공개 온라인 접수 링크는 요강에 명시돼 있지 않다.");
    notes.push("make representatives-meeting date historical without claiming it was held");
  }
  if (post.id === "amateur-seoul-league-finals-20261206") {
    dropStarts(post, ["아래 포스터에는 권역 예선과 본선 일정이 함께 있습니다."]);
    post.body = post.body.replace("이 글은 개최 전 일정 안내이며 확정 참가팀이나 경기 결과를 추정해 적지 않았습니다.", "");
    post.title = "2026 서울시민리그 배드민턴 본선: 권역 예선 1·2위 팀의 12월 6일 은평 일정";
    notes.push("retain qualifier route/date while removing site-selection process commentary");
  }
  if (post.id === "court-indoor-shoe-change-20261021") {
    reviseParagraph(post, "차에서 바로 내려 몇 걸음만 걸었다고", "주차장에서 몇 걸음만 걸었더라도 바깥에서 신은 이력은 같다. 밑창을 닦는 것으로 입장이 허용되는지는 동호회끼리 예외를 정하기보다 시설 운영자에게 묻는다.");
    notes.push("compress repeated outside-use/facility-exception explanation");
  }

  if (post.id === "gear-lining-aeronaut-9000c-20261002") {
    reviseParagraph(post, "수비 때 한 번 늦었다는 이유로", "수비가 늦었다면 잠깐 쉰 뒤 현재 라켓으로 같은 공을 받아 비교한다. 동료에게는 어느 쪽이 더 좋았는지보다 몸 앞에서 처리했는지, 급히 막을 때 면이 흔들렸는지를 물으면 구체적인 기록이 남는다.");
    notes.push("compress repeated trial caveats into model-relevant defense observations");
  }
  if (post.id === "gear-lining-axforce80-4u-20261005") {
    reviseParagraph(post, "기록에는 ‘힘이 잘 나온다’", "시타 기록에는 제자리 클리어, 이동 뒤 늦은 공, 짧은 드라이브를 나눠 적는다. 힘을 낸 한 타구와 작은 동작의 길이 조절은 다른 구매 근거다. 앞코트 타구가 많다면 짧은 드라이브의 편차를 먼저 비교한다.");
    notes.push("replace generic trial-record prose with this review's timing/power comparison fields");
  }
  if (post.id === "gear-lining-bladex-900-sun-4u-20261024") {
    reviseParagraph(post, "사진에서 눈에 띄는 태양 무늬나 색상은", "스트링과 그립이 포함되는지는 사진 속 모습이 아니라 실제 주문 옵션에서 확인한다.");
    reviseParagraph(post, "판매 분류와 후기가 다르다고", "헤드라이트라는 판매 분류와 리뷰어의 약간 헤드헤비한 체감은 설명 기준이 다르다. 구매 전에는 자신의 세팅에서 라켓을 멈췄다가 다시 준비하는 동작이 편한지를 비교한다.");
    notes.push("retain actual SUN classification/reviewer distinction; remove repeated image/setup caveats");
  }
  if (post.id === "gear-victor-auraspeed-100x-ultra-g-20261010") {
    reviseParagraph(post, "첫째는 준비가 된 상태에서의", "첫째는 짧은 드라이브다. 세게 보내기와 가볍게 연결하기를 섞고, 포핸드·백핸드 전환에서 라켓 면을 유지하기 편한지 본다. 처음부터 상대가 빠른 공으로 몰아붙이지 않도록 공급 속도를 맞춘다.");
    reviseParagraph(post, "둘째는 몸 가까이 들어오는 수비다.", "둘째는 몸 가까이 오는 수비다. 작은 스윙으로 원하는 길이를 만든 뒤 다음 공에 라켓을 다시 준비할 수 있는지, 매번 큰 스윙이 필요한지 적는다. 낯선 스트링 감각도 별도로 기록한다.");
    reviseParagraph(post, "셋째는 후위의 클리어와 공격 후 복귀다.", "셋째는 후위 클리어와 공격 뒤 복귀다. 연속 타구에서도 시점이 맞는지 보고, 기존 라켓으로 같은 공을 다시 친다. 준비된 클리어와 급한 수비 중 어느 쪽이 달랐는지를 나누면 빠르다는 첫인상을 설명하기 쉽다.");
    notes.push("make three trial scenes concise observable comparisons rather than repeated general caution");
  }
  if (post.id === "gear-victor-thruster-f-ultra-c-20261023") {
    reviseParagraph(post, "새 라켓을 처음 쓰는 날에는", "비교하는 날에는 익숙한 라켓도 가져가 같은 셔틀로 번갈아 쳐 본다. 어느 동작에서 준비 부담이 줄었는지를 적고, 잘 맞은 스매시와 짧은 수비의 편안함은 따로 평가한다.");
    notes.push("compress repeated old-racket/one-smash setup advice while retaining replacement criteria");
  }
  if (post.id === "gear-yonex-aerosensa-50-20260929") {
    reviseParagraph(post, "제품 사진을 보면 포장 튜브에는", "포장 튜브에는 AEROSENSA 50과 AS-50이 표시되고, 개별 셔틀에는 깃털과 코르크가 보인다. 공동 구매 기록에는 실제 속도 등급, 운동별 투입 개수와 교체 이유를 남긴다. 공개 시험의 한 통 결과를 우리 모임의 수명으로 바꾸는 대신 이 기록으로 다음 주문을 비교한다.");
    notes.push("retain packaging facts and usable purchase record, remove duplicate photo-limit explanation");
  }
  if (post.id === "gear-yonex-arcsaber11pro-20261004") {
    reviseParagraph(post, "라켓 사진의 회색 프레임과 붉은 샤프트는", "회색 프레임과 붉은 샤프트, PRO 표기는 모델을 구별하는 단서다. 같은 아크세이버 계열의 TOUR·PLAY와 섞지 말고 주문할 무게·그립과 스트링 포함 여부를 실제 옵션에서 확인한다.");
    notes.push("retain model/color/version facts with a concise order check");
  }
  if (post.id === "yonex-astrox-77-pro-research-review") {
    reviseParagraph(post, "이 글의 결론은 누구에게나 맞는 라켓이라는", "77 PRO는 파워와 속도의 균형을 검토할 후보이지만, 구매 이유는 자신의 연속 클리어·몸 앞 수비·운동 후반 연결에서 찾아야 한다. 비교할 때 쓴 무게와 그립, 스트링 조건을 함께 남겨 다음 시타에서도 같은 질문을 확인한다.");
    notes.push("replace repetitive meta-conclusion with the article's concrete three-scene buying decision");
  }

  if (post.id === "lesson-doubles-rotation-communication") {
    reviseParagraph(post, "코치에게는 ‘우리 둘 사이가 비는 순간이", "코치에게는 가운데가 비는 타구와 서로의 시야를 가리는 위치를 보여 준다. 촬영에 동의했다면 셔틀을 치지 않는 파트너까지 보이게 찍어 두 사람의 이동을 함께 비교한다. 한쪽 선택이 틀렸다고 정하기 전에 같은 장면을 어떻게 봤는지 듣는다.");
    notes.push("keep lesson focused on observable two-player movement rather than repeated conversation scripts");
  }
  if (post.id === "lesson-first-month-practice-plan") {
    post.body = post.body.replace("## 그립은 세게 잡는 능력보다 바꿀 수 있는 여유", "## 그립과 준비 자세에서 출발하기")
      .replace("## 준비 자세는 멈춰 있는 모양이 아닙니다\n\n", "")
      .replace("## 한 타구와 돌아오는 동작을 묶어서 연습하세요", "## 타구와 복귀를 짧은 랠리로 잇기")
      .replace("## 강한 스매시보다 반복 가능한 연결을 먼저\n\n", "")
      .replace("## 코치에게는 결과와 조건을 함께 질문하세요", "## 코치에게 가져갈 질문과 세 줄 기록")
      .replace("## 다음 수업 전에 남길 세 줄\n\n", "");
    notes.push("combine adjacent related sections into a usable first-lesson path while retaining all instruction facts");
  }
  if (post.id === "lesson-net-shot-control-20260923") {
    dropStarts(post, ["네트에 가까울수록 좋은 타구라는 생각도 잠시 내려놓으세요."]);
    notes.push("remove repeated wide-target/own-progress explanation already established in the target and five-shot sections");
  }
  if (post.id === "lesson-rear-court-backhand-clear-20261003") {
    reviseParagraph(post, "시범을 보고 손잡이를 돌릴 때도", "그립은 멈춘 상태에서 두 위치를 천천히 바꾸며 익힌 뒤 셔틀과 연결한다. 손에서 바꿀 수 있게 된 것과 이동 중 같은 전환을 끝내는 것은 다른 과제다. 어려운 구간을 코치에게 보여 주고, 준비가 유지될 때 공급 속도를 높인다.");
    notes.push("compress generic grip-learning prose into the actual stationary-to-moving comparison");
  }
  if (post.id === "lesson-rearcourt-backhand-drop-20261018") {
    reviseParagraph(post, "공급이 좌우로 흔들렸던 묶음은", "공급이 흔들린 묶음은 따로 표시한다. 몸 뒤로 더 깊게 들어온 공을 같은 조건의 드롭과 합쳐 평가하지 않는다. 일정한 공급이 어렵다면 코치가 직접 올려 주는 구간에서 먼저 기준을 잡는다. 기록은 파트너를 탓하는 대신 다음에 다시 비교할 범위를 정하는 데 쓴다.");
    post.body = join([post.body, "기록 양식 예시: 공급 위치 ___ / 제자리·이동 뒤 ___ / 네트·높게 뜸·목표 안 ___ / 타구 뒤 앞을 향해 준비했는지 ___ / 다음에 다시 볼 조건 ___. 수치는 실제 연습 뒤에 적고 빈칸을 예상 성공 횟수로 채우지 않는다."]);
    notes.push("replace repeated supply caveats with concise conditions and a blank topic-specific observation record, not invented results");
  }
  if (post.id === "lesson-singles-clear-drop-pattern-20260926") {
    replaceRequired(post, "패턴이 이어지면 코치가 클리어와 드롭 중 하나를 무작위로 지정하지 않고, 연습자가 상대 위치를 보고 선택하도록 바꿉니다.", "패턴이 익숙해지면 공급하는 파트너가 공을 보낸 뒤 앞이나 뒤 한쪽에 준비하고, 연습자는 그 위치를 보고 빈 구역으로 클리어와 드롭을 고릅니다. 처음에는 두 사람이 합의한 느린 속도에서 위치와 선택을 비교합니다.", "observable opponent-position choice");
    notes.push("make opponent-position reading physically observable in the existing feed exercise");
  }

  if (post.id === "news-an-denmark-opener-buhrova-20261015") {
    post.body = post.body.replace("## 15일 한국 오후 4시부터 16강", "## 10월 15일 16강 당시 편성");
    notes.push("make expired broadcast/session section explicitly historical; retain unique 2025 doubles context");
  }
  if (post.id === "news-an-denmark-quarterfinal-20261016") {
    replaceRequired(post, "8강은 16일 현지 오전 11시, 한국 시간 오후 6시부터 시작한다.", "당시 8강 전체 일정은 10월 16일 현지 오전 11시, 한국 시간 오후 6시 시작으로 안내됐다.", "dated quarterfinal session");
    notes.push("date-scope the quarterfinal preview while retaining previous-round and 2025 final facts");
  }
  if (post.id === "news-an-seyoung-denmark-final-20261018") {
    post.body = post.body.replace("## 결승 세션은 오늘 오후 7시부터", "## 10월 18일 결승 당시 편성");
    notes.push("replace expired today section with dated final-preview frame");
  }
  if (post.id === "news-an-yoo-asian-games-qf-20260927") {
    replaceRequired(post, "2승이라는 요약 뒤에는 린춘이전의 안정적인 초반 운영과 시위치전의 긴 두 번째 게임이 각각 놓여 있습니다. 이번 8강 진출은 큰 한 경기뿐 아니라 같은 날 두 라운드를 연속 통과한 결과입니다. ", "", "repeated/inferred score commentary");
    post.body = post.body.replace("한국 선수의 26일 결과는 조직위원회 시스템의 공식 종료 기록을 기준으로 정리했습니다.", "");
    notes.push("remove inferred stable-operation and editorial-work prose; retain all actual match/retirement/time facts");
  }
  if (post.id === "news-french-open-semifinal-and-doubles-20261024") {
    post.body = post.body.replace("아직 경기 전인 만큼 승패와 결승 상대는 정해지지 않았다. ", "");
    replaceRequired(post, "안세영-오쿠하라전은 현지 24일 오전 9시 30분 예정으로 발표됐다.", "당시 예고된 안세영-오쿠하라 준결승은 현지 10월 24일 오전 9시 30분 예정이었다.", "dated French semifinal preview");
    notes.push("retain organizer interview/results; make last scheduled match a historical preview");
  }
  if (post.id === "news-kim-seo-french-open-start-20261021") {
    post.body = post.body.replace("한국 시간 21일 오전 현재 안세영의 첫 경기 결과가 나온 것은 아니다. 출전 예정 소식에 이어 첫 경기에서 어떤 모습을 보일지가 관심사다.", "이 대진은 10월 21일 첫 경기에 앞서 공개된 편성이다.");
    notes.push("replace stale current/no-result commentary with exact original preview stage");
  }
  if (post.id === "news-korea-asian-games-finals-20260929") {
    post.body = post.body.replace("조직위원회 공식 결과표의 네 경기는 모두 종료 상태이며, 결승 두 경기는 29일 편성표에 아직 점수 없이 올라 있다.", "9월 28일 네 준결승의 결과와 29일 결승 예고를 함께 전한 기사다.")
      .replace("다만 두 경기 점수만으로 체력 상태나 다음 경기의 우세를 단정할 수는 없다. ", "")
      .replace("관전할 때는 표기 시각을 확정된 셔틀 시작 시각으로 읽기보다 당일 진행 상태를 확인해야 한다. 우승자나 결승 점수는 경기가 공식 종료된 뒤에만 기록한다. ", "")
      .replace("개인전 결승의 승패를 그 경기 한 번으로 미리 판단할 수는 없다.", "")
      .replace("두 경기 모두 현재 시작 전으로 표시돼 있으며", "당시 두 경기는 시작 전으로 표시됐으며");
    notes.push("retain semifinal/previous match facts; remove work-process repetition and date-scope final preview");
  }
  if (notes.length) post.body = tidyHeadings(post.body).trim();
  if (post.body !== original.body || post.title !== original.title || post.excerpt !== original.excerpt || !isDeepStrictEqual(post.event, original.event) || post.editorialNote !== original.editorialNote) {
    if (post.category === "레슨 & 가이드" && post.body.replace(/\s/g, "").length < 2000) throw new Error(`${post.id}: lesson below existing schema minimum`);
    post.updatedAt = editedAt;
    // Identity, visibility, source/rights metadata and original publication date are invariants.
    for (const field of ["id", "date", "status", "sample", "managedBy", "images", "sources", "sourceUrl", "sourceName", "newsDate", "seriesDate"]) {
      if (!isDeepStrictEqual(post[field], original[field])) throw new Error(`${post.id}: protected field ${field} changed`);
    }
    if (!/^[a-f0-9]{32}$/.test(row.hash)) throw new Error(`${post.id}: missing baseline hash`);
    changes.push({ article: post, expectedHash: row.hash, auditNotes: notes });
  }
}
if (!changes.length) throw new Error("No maintenance changes generated");
const batch = changes.map(({ article, expectedHash }) => ({ article, expectedHash }));
validateEditorialBatch(batch, true);
await writeFile(outputPath, JSON.stringify(batch, null, 2) + "\n");
report.maintenance = {
  generatedAt: editedAt, batchPath: outputPath, reviewedPublishedNonSample: rows.filter(row => row.data.status === "published" && !row.data.sample).length,
  changed: changes.length, unchanged: rows.filter(row => row.data.status === "published" && !row.data.sample).length - changes.length,
  skipped, validation: "validateEditorialBatch(batch, true) passed offline; protected identity/status/date/source/image fields unchanged",
  publication: "Not published; no database or network calls. All changed articles remain published at original IDs/URLs.",
  changes: changes.map(({ article, expectedHash, auditNotes }) => ({ id: article.id, expectedHash, notes: auditNotes })),
  supportedNoChange,
};
const inScopeAudit = report.articles.filter(item => item.inScope);
report.summary.recommendations = Object.fromEntries(["keep", "revise", "review_hold"].map(action => [action, inScopeAudit.filter(item => item.recommendation === action).length]));
const changedIds = new Set(changes.map(({ article }) => article.id));
const pending = inScopeAudit.filter(item => item.recommendation !== "keep" && !changedIds.has(item.id));
if (pending.length) throw new Error(`Unaddressed required audit recommendations: ${pending.map(item => item.id).join(", ")}`);
report.maintenance.unaddressedRequiredRecommendations = 0;
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ reviewed: report.maintenance.reviewedPublishedNonSample, changed: changes.length, unchanged: report.maintenance.unchanged, skipped: skipped.length, batchPath: outputPath }, null, 2));
