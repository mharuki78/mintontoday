import test from "node:test";
import assert from "node:assert/strict";
import { openingRally, nextRally, nextService } from "../lib/doubles-practice.ts";

test("changing service does not swap partners; scoring on service does", () => {
  let state = openingRally;
  const rallySequence = [
    [0, [1, 0], "A", "D", "왼쪽"],
    [1, [1, 1], "D", "A", "왼쪽"],
    [1, [1, 2], "D", "B", "오른쪽"],
    [0, [2, 2], "B", "D", "오른쪽"],
    [1, [2, 3], "C", "A", "왼쪽"],
  ];
  assert.deepEqual(nextService(state), { server: "A", receiver: "C", side: "오른쪽" });
  for (const [winner, points, server, receiver, side] of rallySequence) {
    state = nextRally(state, winner);
    assert.deepEqual(state.points, points);
    assert.deepEqual(nextService(state), { server, receiver, side });
  }
  assert.deepEqual(openingRally, { points: [0, 0], rightPlayer: [0, 0], serving: 0 });
});
