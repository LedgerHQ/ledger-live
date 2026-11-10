import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  debugBase,
  failedRows,
  fromJsStart,
  fromProcessStart,
  pairUp,
  summarise,
  type Row,
} from "./analyze.ts";
import { comparison, launch, startsDifferWithFallback } from "./fake-samples.ts";

const GATE = { preset: "custom", thresholdMs: 100 };
function rowOf(rows: Row[], measure: (name: string) => boolean): Row {
  const row = rows.find(r => measure(r.measure));
  assert.ok(row, "no such row");
  return row;
}
const debugRow = (rows: Row[]) => rowOf(rows, name => name.startsWith("Debug screen"));
const nativeRow = (rows: Row[]) => rowOf(rows, name => name === "With native start");

describe("pairUp", () => {
  it("pairs A and B of the same round and drops warm-ups, failures and unpaired launches", () => {
    const samples = [
      launch({ side: "A", round: -1, warmup: true, appStartupTime: 5000 }),
      launch({ side: "A", round: 0, appStartupTime: 1000 }),
      launch({ side: "B", round: 0, appStartupTime: 1100 }),
      launch({ side: "A", round: 1, appStartupTime: 1000 }),
      launch({ side: "B", round: 1, ok: false, appStartupTime: 900 }),
      launch({ side: "A", round: 2, appStartupTime: 1000 }),
    ];
    assert.deepEqual(
      pairUp(samples, s => s.appStartupTime),
      [{ platform: "android", scenario: "accounts", phase: 0, A: 1000, B: 1100 }],
    );
  });

  it("drops a round where only one launch followed a read of the Debug screen", () => {
    const samples = [
      launch({ side: "A", round: 0, afterScreenRead: true, appStartupTime: 1300 }),
      launch({ side: "B", round: 0, appStartupTime: 1000 }),
      launch({ side: "A", round: 1, afterScreenRead: true, appStartupTime: 1300 }),
      launch({ side: "B", round: 1, afterScreenRead: true, appStartupTime: 1300 }),
      launch({ side: "A", round: 2, afterScreenRead: false, appStartupTime: 1000 }),
      launch({ side: "B", round: 2, appStartupTime: 1000 }),
    ];
    assert.deepEqual(
      pairUp(samples, s => s.appStartupTime).map(p => [p.A, p.B]),
      [
        [1300, 1300],
        [1000, 1000],
      ],
    );
  });
});

describe("failedRows", () => {
  it("fails without rows", () => {
    assert.equal(failedRows([]), true);
  });
  for (const verdict of ["FAIL: B is slower", "Not detected [0, 0]", "Not enough pairs"]) {
    it(`fails on "${verdict}"`, () => {
      assert.equal(failedRows([{ verdict: "PASS" }, { verdict }]), true);
    });
  }
  for (const verdict of [
    "PASS (inconclusive: [50, 150] contains 100 ms)",
    "Detected: B is 300 ms slower",
    "OK: resolves about ±20 ms",
  ]) {
    it(`passes on "${verdict}"`, () => {
      assert.equal(failedRows([{ verdict }]), false);
    });
  }
});

describe("debugBase", () => {
  it("is js when the Debug value starts at the first JS import", () => {
    assert.equal(debugBase(launch({ side: "A", appStartupTime: 700, jsStartOffset: 5 })), "js");
  });
  it("is process when it starts where the harness reads the process start", () => {
    const s = launch({ side: "A", appStartupTime: 1500, jsStartOffset: 800, nativeStartMs: 760 });
    assert.equal(debugBase(s), "process");
  });
  it("is null without startup events", () => {
    const s = launch({ side: "A", appStartupTime: 1000 });
    delete s.events;
    assert.equal(debugBase(s), null);
  });
});

describe("fromJsStart and fromProcessStart", () => {
  it("give the same times for builds that count from different starts", () => {
    const jsBased = launch({
      side: "A",
      appStartupTime: 700,
      jsStartOffset: 0,
      nativeStartMs: 800,
    });
    const processBased = launch({ side: "B", appStartupTime: 1500, jsStartOffset: 800 });
    assert.equal(fromJsStart(jsBased), fromJsStart(processBased));
    assert.equal(fromProcessStart(jsBased), 1500);
  });
});

describe("summarise", () => {
  it("passes when B is as fast as A", () => {
    const rows = summarise(comparison({ deltaMs: 0 }), GATE);
    assert.deepEqual(
      rows.map(r => [r.measure, r.verdict]),
      [
        ["Debug screen", "PASS"],
        ["With native start", "PASS"],
      ],
    );
  });

  it("fails when B is slower than A by more than the threshold", () => {
    const row = debugRow(summarise(comparison({ deltaMs: 200 }), GATE));
    assert.equal(row.hl?.estimate, 200);
    assert.equal(row.verdict, "FAIL: B is slower by more than 100 ms");
  });

  it("takes the device bias out of B − A", () => {
    const row = debugRow(summarise(comparison({ deltaMs: 0, secondDeviceSlowerByMs: 300 }), GATE));
    assert.equal(row.instanceBias, 300);
    assert.deepEqual(row.hl, { estimate: 0, low: 0, high: 0 });
    assert.equal(row.verdict, "PASS");
  });

  const noisy = (slowdowns: number[]) => {
    const samples = comparison({ pairs: 12, deltaMs: 0 });
    samples
      .filter(s => s.side === "B")
      .forEach(
        (s, i) => (s.appStartupTime = (s.appStartupTime ?? 0) + slowdowns[i % slowdowns.length]),
      );
    return debugRow(summarise(samples, GATE));
  };

  it("gates on the estimate and says when the interval holds the threshold", () => {
    const row = noisy([-60, 140, 40, 230, 90, 180]);
    assert.deepEqual(row.hl, { estimate: 110, low: 40, high: 180 });
    assert.equal(
      row.verdict,
      "FAIL: B is slower by more than 100 ms (inconclusive: [40, 180] contains 100 ms)",
    );
  });

  it("passes an estimate under the threshold even when the interval holds it", () => {
    const row = noisy([-100, 100, 0, 190, 50, 140]);
    assert.deepEqual(row.hl, { estimate: 70, low: 0, high: 140 });
    assert.equal(row.verdict, "PASS (inconclusive: [0, 140] contains 100 ms)");
  });

  it("gives no verdict without pairs on both sides of the device swap", () => {
    const row = debugRow(summarise(comparison({ deltaMs: 0, phases: [0] }), GATE));
    assert.equal(
      row.verdict,
      "Not enough pairs: 3 before the device swap, 0 after (3 needed on each side)",
    );
    assert.equal(failedRows([row]), true);
  });

  it("gives no verdict below three pairs on each side of the device swap", () => {
    const row = debugRow(summarise(comparison({ pairs: 4, deltaMs: 0 }), GATE));
    assert.equal(
      row.verdict,
      "Not enough pairs: 2 before the device swap, 2 after (3 needed on each side)",
    );
  });

  it("does not rest the device bias on a phase of one pair", () => {
    const pair = (phase: number, round: number, a: number, b: number) => [
      launch({ side: "A", phase, round, appStartupTime: a }),
      launch({ side: "B", phase, round, appStartupTime: b }),
    ];
    const samples = [
      ...Array.from({ length: 9 }, (_, round) => pair(0, round, 1000, 1000)).flat(),
      ...pair(1, 0, 1400, 1000),
    ];
    const row = debugRow(summarise(samples, { preset: "known-regression", thresholdMs: 100 }));
    assert.equal(
      row.verdict,
      "Not enough pairs: 9 before the device swap, 1 after (3 needed on each side)",
    );
    assert.equal(failedRows([row]), true);
  });

  it("still gives a verdict with three pairs on one side of the device swap", () => {
    const pair = (phase: number, round: number, b: number) => [
      launch({ side: "A", phase, round, appStartupTime: 1000 }),
      launch({ side: "B", phase, round, appStartupTime: b }),
    ];
    const samples = [
      ...[990, 1000, 1010].map((b, round) => pair(0, round, b)).flat(),
      ...[980, 995, 1000, 1005, 1020, 990, 1010, 1000, 985]
        .map((b, round) => pair(1, round, b))
        .flat(),
    ];
    const row = debugRow(summarise(samples, GATE));
    assert.deepEqual(row.pairsPerPhase, [3, 9]);
    assert.match(row.verdict, /^PASS/);
  });

  it("compares from the first JS import when A and B count from different starts", () => {
    const samples = comparison({
      deltaMs: 0,
      a: { jsStartOffset: 0, nativeStartMs: 800 },
      b: { jsStartOffset: 800, nativeStartMs: 800 },
    }).map(s => (s.side === "B" ? { ...s, appStartupTime: (s.appStartupTime ?? 0) + 800 } : s));
    const rows = summarise(samples, GATE);
    const row = debugRow(rows);
    assert.equal(row.measure, "Debug screen, from JS start");
    assert.deepEqual(row.bases, { A: "js", B: "process" });
    assert.equal(row.verdict, "PASS");
    assert.equal(nativeRow(rows).verdict, "PASS");
  });

  it("keeps a launch that fell back to the first JS import when comparing from there", () => {
    const row = debugRow(summarise(startsDifferWithFallback(), GATE));
    assert.equal(row.measure, "Debug screen, from JS start");
    assert.equal(row.pairs, 6);
    assert.deepEqual(row.hl, { estimate: 0, low: 0, high: 0 });
    assert.deepEqual(row.offBaseLaunches, { A: 0, B: 1 });
  });

  it("leaves out of the Debug screen row a launch that counted from another start", () => {
    const samples = comparison({
      pairs: 8,
      deltaMs: 0,
      a: { jsStartOffset: 800, nativeStartMs: 800 },
      b: { jsStartOffset: 800, nativeStartMs: 800 },
    });
    const firstA = samples.find(s => s.side === "A");
    assert.ok(firstA?.events);
    firstA.events["Before js imports"].time = 0;
    const row = debugRow(summarise(samples, GATE));
    assert.deepEqual(row.offBaseLaunches, { A: 1, B: 0 });
    assert.equal(row.pairs, 7);
  });

  it("fails the native start row of a build without the JS start epoch event", () => {
    const samples = comparison({ deltaMs: 0 }).map(s =>
      s.side === "B" ? { ...s, events: { "Before js imports": { count: 1, time: 5 } } } : s,
    );
    const row = nativeRow(summarise(samples, GATE));
    assert.equal(row.verdict, "Not enough pairs");
    assert.equal(failedRows([row]), true);
  });

  it("counts failed launches but not warm-ups", () => {
    const samples = [
      ...comparison({ deltaMs: 0 }),
      launch({ side: "A", round: -1, warmup: true, ok: false, appStartupTime: NaN }),
      launch({ side: "B", round: 9, ok: false, appStartupTime: NaN }),
    ];
    const row = debugRow(summarise(samples, GATE));
    assert.equal(row.failed, 1);
    assert.equal(row.launches, 13);
  });

  it("detects the re-added regression when B is slower by more than the threshold", () => {
    const row = debugRow(
      summarise(comparison({ deltaMs: 300 }), { preset: "known-regression", thresholdMs: 100 }),
    );
    assert.equal(row.verdict, "Detected: B is 300 ms slower");
  });

  it("fails known-regression when B is not slower by more than the threshold", () => {
    const row = debugRow(
      summarise(comparison({ deltaMs: 80 }), { preset: "known-regression", thresholdMs: 100 }),
    );
    assert.equal(row.verdict, "Not detected: B − A is 80 ms [80, 80], not above 100 ms");
    assert.equal(failedRows([row]), true);
  });

  it("reports the resolution of an A/A run", () => {
    const row = debugRow(
      summarise(comparison({ deltaMs: 0 }), { preset: "aa-noise", thresholdMs: 100 }),
    );
    assert.equal(row.verdict, "OK: resolves about ±0 ms");
  });

  it("counts the fallbacks of each build and leaves out the pairs they make uneven", () => {
    // B's log line never comes, so each A launch follows a read of the screen.
    const samples = comparison({
      deltaMs: 0,
      a: { readFrom: "log", afterScreenRead: true },
      b: { readFrom: "screen-fallback" },
    });
    const row = debugRow(summarise(samples, GATE));
    assert.deepEqual(row.reads.fallbacks, { A: 0, B: 6 });
    assert.equal(row.reads.unevenPairs, 6);
    assert.equal(row.pairs, 0);
    assert.match(row.verdict, /^Not enough pairs/);
    assert.equal(failedRows([row]), true);
  });

  it("fails every preset and measure when the Debug screen and the device log disagree", () => {
    const samples = comparison({ deltaMs: 0, a: { readFrom: "log", screenAppStartupTime: 1000 } });
    const differs = samples.find(s => s.side === "A");
    if (!differs) throw new Error("no A launch");
    differs.screenAppStartupTime = 1040;
    for (const preset of ["custom", "aa-noise", "known-regression"]) {
      const rows = summarise(samples, { preset, thresholdMs: 100 });
      assert.deepEqual(
        rows.map(r => r.verdict),
        Array(2).fill(
          "FAIL: the Debug screen showed another App startup time than the device log on 1 of the 6 launches read both ways",
        ),
      );
      assert.equal(failedRows(rows), true);
    }
  });

  it("keeps the longest device log line", () => {
    const samples = comparison({ deltaMs: 0, a: { logLineBytes: 423 }, b: { logLineBytes: 430 } });
    assert.equal(debugRow(summarise(samples, GATE)).reads.longestLogLine, 430);
    assert.equal(debugRow(summarise(comparison({ deltaMs: 0 }), GATE)).reads.longestLogLine, null);
  });
});
