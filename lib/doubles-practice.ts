export type Team = 0 | 1;
export type RallyState = {
  points: [number, number];
  rightPlayer: [number, number];
  serving: Team;
};

export const openingRally: RallyState = { points: [0, 0], rightPlayer: [0, 0], serving: 0 };
const pairs = [["A", "B"], ["C", "D"]];

export function nextRally(previous: RallyState, winner: Team): RallyState {
  const points: [number, number] = [...previous.points];
  const rightPlayer: [number, number] = [...previous.rightPlayer];
  points[winner]++;
  if (winner === previous.serving) rightPlayer[winner] = 1 - rightPlayer[winner];
  return { points, rightPlayer, serving: winner };
}

export function playerInCourt(state: RallyState, team: Team, right: boolean) {
  const index = state.rightPlayer[team];
  return pairs[team][right ? index : 1 - index];
}

export function nextService(state: RallyState) {
  const right = state.points[state.serving] % 2 === 0;
  const receiving = state.serving === 0 ? 1 : 0;
  return {
    side: right ? "오른쪽" : "왼쪽",
    server: playerInCourt(state, state.serving, right),
    receiver: playerInCourt(state, receiving, right),
  };
}
