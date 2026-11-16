// What the report claims about its intervals and its gate, checked on simulated runs whose true
// B − A is known: launches with ±40 ms of noise, 1 in 20 slowed by 300–800 ms, and a second device
// 150 ms slower, which the halfway swap must take out.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Sample } from "../types.ts";
import { summarise, type Row } from "./analyze.ts";
import { launch } from "./fake-samples.ts";
import { closed, seededRandom } from "./stats.ts";

const THRESHOLD_MS = 100;
const RUNS = 200;
const DEVICE_BIAS_MS = 150;

function noisyLaunches(random: () => number) {
  const gaussian = () =>
    Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random()) * 40;
  return () => (random() < 0.05 ? gaussian() + 300 + 500 * random() : gaussian());
}

/** The Debug screen row of `RUNS` simulated runs of the custom preset. */
function simulate({
  seed,
  trueDeltaMs,
  pairsPerPhase = [10, 10],
}: {
  seed: number;
  trueDeltaMs: number;
  pairsPerPhase?: number[];
}): Row[] {
  const noise = noisyLaunches(seededRandom(seed));
  return Array.from({ length: RUNS }, () => {
    const samples: Sample[] = [];
    for (const [phase, rounds] of pairsPerPhase.entries()) {
      for (let round = 0; round < rounds; round++) {
        for (const side of ["A", "B"] as const) {
          const onSecondDevice = (side === "B") === (phase === 0);
          const appStartupTime =
            1000 +
            (side === "B" ? trueDeltaMs : 0) +
            (onSecondDevice ? DEVICE_BIAS_MS : 0) +
            noise();
          samples.push(launch({ side, phase, round, appStartupTime }));
        }
      }
    }
    const rows = summarise(samples, { preset: "custom", thresholdMs: THRESHOLD_MS });
    const row = rows.find(r => r.measure === "Debug screen");
    assert.ok(row, "no Debug screen row");
    return row;
  });
}

const share = (rows: Row[], hit: (row: Row) => boolean) => rows.filter(hit).length / rows.length;
const fails = (row: Row) => row.verdict.startsWith("FAIL");
const covers = (truth: number) => (row: Row) => {
  const interval = closed(row.hl);
  return interval !== null && interval.low <= truth && truth <= interval.high;
};

describe("the 95% interval", () => {
  it("covers the true B − A in at least 90% of runs (94% over 1,500 runs)", () => {
    assert.ok(share(simulate({ seed: 1, trueDeltaMs: 0 }), covers(0)) >= 0.9);
  });

  it("covers it in at least 85% of runs with 3 and 9 pairs around the swap (90.5% over 1,500)", () => {
    const rows = simulate({ seed: 2, trueDeltaMs: 0, pairsPerPhase: [3, 9] });
    assert.ok(share(rows, covers(0)) >= 0.85);
  });
});

describe("the gate", () => {
  it("almost never fails a B as fast as A, despite the device bias", () => {
    assert.ok(share(simulate({ seed: 3, trueDeltaMs: 0 }), fails) <= 0.01);
  });

  it("fails a B slower by exactly the threshold about half the time", () => {
    const rate = share(simulate({ seed: 4, trueDeltaMs: THRESHOLD_MS }), fails);
    assert.ok(rate >= 0.38 && rate <= 0.62, `failed ${rate} of the runs`);
  });

  it('fails a B slower by its "Flags a slowdown of" value at least 75% of the time', () => {
    const aa = simulate({ seed: 5, trueDeltaMs: 0 });
    const detectable = aa
      .map(row => row.detectable ?? Number.NaN)
      .sort((a, b) => a - b)
      .at(RUNS / 2);
    assert.ok(detectable !== undefined && Number.isFinite(detectable));
    const rate = share(simulate({ seed: 6, trueDeltaMs: detectable }), fails);
    assert.ok(rate >= 0.75, `a true ${detectable} ms failed ${rate} of the runs`);
  });
});
