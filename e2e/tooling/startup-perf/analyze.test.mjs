import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bootstrapMean,
  debugBase,
  detectableAt80,
  failedRows,
  fromJsStart,
  fromProcessStart,
  hodgesLehmann,
  median,
  pairUp,
  robustSd,
  summarise,
  toMarkdown,
} from "./analyze.mjs";

const PROCESS_START = 1_700_000_000_000;

function launch({ side, appStartupTime, jsStartOffset = 5, nativeStartMs = 400, ...rest }) {
  return {
    platform: "android",
    scenario: "accounts",
    phase: 0,
    round: 0,
    side,
    ok: true,
    appStartupTime,
    processStartAppClockAt: PROCESS_START,
    events: {
      "Before js imports": { count: 1, time: jsStartOffset },
      [`JS start epoch ${PROCESS_START + nativeStartMs}`]: { count: 1, time: jsStartOffset + 1 },
    },
    ...rest,
  };
}

// Phase 0 runs A on the first device and B on the second; phase 1 swaps them.
function comparison({ pairs = 6, deltaMs, secondDeviceSlowerByMs = 0, phases = [0, 1], a, b }) {
  const samples = [];
  for (const phase of phases) {
    for (let round = 0; round < pairs / 2; round++) {
      for (const side of ["A", "B"]) {
        const onSecondDevice = (side === "B") === (phase === 0);
        const value = 1000 + (side === "B" ? deltaMs : 0);
        samples.push(
          launch({
            side,
            phase,
            round,
            appStartupTime: value + (onSecondDevice ? secondDeviceSlowerByMs : 0),
            ...(side === "A" ? a : b),
          }),
        );
      }
    }
  }
  return samples;
}

const GATE = { preset: "custom", thresholdMs: 100 };
const debugRow = rows => rows.find(r => r.measure.startsWith("Debug screen"));
const nativeRow = rows => rows.find(r => r.measure === "With native start");

describe("median", () => {
  it("takes the middle value of an odd count", () => {
    assert.equal(median([3, 1, 2]), 2);
  });
  it("averages the two middle values of an even count", () => {
    assert.equal(median([4, 1, 3, 2]), 2.5);
  });
  it("is null without values", () => {
    assert.equal(median([]), null);
  });
});

describe("robustSd", () => {
  it("ignores a single outlier", () => {
    assert.equal(robustSd([1, 2, 3, 4, 100]), 1.4826);
  });
});

describe("hodgesLehmann", () => {
  it("gives no interval below six differences", () => {
    assert.deepEqual(hodgesLehmann([1, 2, 3]), { estimate: 2, low: null, high: null });
  });
  it("spans the extremes with exactly six differences", () => {
    assert.deepEqual(hodgesLehmann([0, 1, 2, 3, 4, 5]), { estimate: 2.5, low: 0, high: 5 });
  });
  it("is not pulled by one outlier", () => {
    assert.equal(hodgesLehmann([10, 10, 10, 10, 10, 1000]).estimate, 10);
  });
  it("is null without differences", () => {
    assert.equal(hodgesLehmann([]), null);
  });
});

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
    "Detected: the fix is 300 ms faster",
    "OK: resolves about ±20 ms",
    'Not measured: build A has no "JS start epoch" event',
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
  it("is package when it starts more than 100 ms away from the process start", () => {
    const s = launch({ side: "A", appStartupTime: 1100, jsStartOffset: 300, nativeStartMs: 800 });
    assert.equal(debugBase(s), "package");
  });
  it("is native when the harness has no process start on the app's clock", () => {
    const s = launch({ side: "A", appStartupTime: 1500, jsStartOffset: 800 });
    delete s.processStartAppClockAt;
    assert.equal(debugBase(s), "native");
  });
  it("uses the host's process start on iOS samples without the app clock one", () => {
    const s = launch({
      side: "A",
      appStartupTime: 1500,
      jsStartOffset: 800,
      nativeStartMs: 800,
      platform: "ios",
    });
    s.processStartAt = s.processStartAppClockAt;
    delete s.processStartAppClockAt;
    assert.equal(debugBase(s), "process");
  });
  it("is null without startup events", () => {
    assert.equal(debugBase({ appStartupTime: 1000 }), null);
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

describe("detectableAt80", () => {
  it("adds 0.84 standard errors, read off the 95% interval, to the threshold", () => {
    const standardError = 100 / (2 * 1.959964);
    assert.ok(
      Math.abs(detectableAt80({ low: -50, high: 50 }, 100) - (100 + 0.8416 * standardError)) < 1e-9,
    );
  });
  it("is null without an interval", () => {
    assert.equal(detectableAt80({ estimate: 0, low: null, high: null }, 100), null);
  });
});

describe("bootstrapMean", () => {
  const diffs = [12, -40, 33, 7, 85, -3, 21, 0];
  it("returns the same interval for the same differences", () => {
    assert.deepEqual(bootstrapMean(diffs), bootstrapMean(diffs));
  });
  it("brackets the mean", () => {
    const { estimate, low, high } = bootstrapMean(diffs);
    assert.equal(estimate, 14.375);
    assert.ok(low < estimate && estimate < high);
  });
  it("is null below six differences", () => {
    assert.equal(bootstrapMean([1, 2, 3]), null);
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
    assert.equal(row.hl.estimate, 200);
    assert.equal(row.verdict, "FAIL: B is slower by more than 100 ms");
  });

  it("takes the device bias out of B − A", () => {
    const row = debugRow(summarise(comparison({ deltaMs: 0, secondDeviceSlowerByMs: 300 }), GATE));
    assert.equal(row.instanceBias, 300);
    assert.deepEqual(row.hl, { estimate: 0, low: 0, high: 0 });
    assert.equal(row.verdict, "PASS");
  });

  const noisy = slowdowns => {
    const samples = comparison({ pairs: 12, deltaMs: 0 });
    samples
      .filter(s => s.side === "B")
      .forEach((s, i) => (s.appStartupTime += slowdowns[i % slowdowns.length]));
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
    assert.equal(row.verdict, "Not enough pairs: none on one side of the device swap");
    assert.equal(failedRows([row]), true);
  });

  it("gives no verdict below six pairs", () => {
    const row = debugRow(summarise(comparison({ pairs: 4, deltaMs: 0 }), GATE));
    assert.equal(row.verdict, "Not enough pairs");
  });

  it("compares from the first JS import when A and B count from different starts", () => {
    const samples = comparison({
      deltaMs: 0,
      a: { jsStartOffset: 0, nativeStartMs: 800 },
      b: { jsStartOffset: 800, nativeStartMs: 800 },
    }).map(s => (s.side === "B" ? { ...s, appStartupTime: s.appStartupTime + 800 } : s));
    const rows = summarise(samples, GATE);
    const row = debugRow(rows);
    assert.equal(row.measure, "Debug screen, from JS start");
    assert.deepEqual(row.bases, { A: "js", B: "process" });
    assert.equal(row.verdict, "PASS");
    assert.equal(nativeRow(rows).verdict, "PASS");
  });

  it("leaves out of the Debug screen row a launch that counted from another start", () => {
    const samples = comparison({
      pairs: 8,
      deltaMs: 0,
      a: { jsStartOffset: 800, nativeStartMs: 800 },
      b: { jsStartOffset: 800, nativeStartMs: 800 },
    });
    samples.find(s => s.side === "A").events["Before js imports"].time = 0;
    const row = debugRow(summarise(samples, GATE));
    assert.deepEqual(row.offBaseLaunches, { A: 1, B: 0 });
    assert.equal(row.pairs, 7);
  });

  it("does not measure the native start of a build without the JS start epoch event", () => {
    const samples = comparison({ deltaMs: 0 }).map(s =>
      s.side === "B" ? { ...s, events: { "Before js imports": { count: 1, time: 5 } } } : s,
    );
    assert.equal(
      nativeRow(summarise(samples, GATE)).verdict,
      'Not measured: build B has no "JS start epoch" event',
    );
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

  it("detects the known regression when the fix makes B faster", () => {
    const row = debugRow(
      summarise(comparison({ deltaMs: -300 }), { preset: "known-regression", thresholdMs: 100 }),
    );
    assert.equal(row.verdict, "Detected: the fix is 300 ms faster");
  });

  it("fails known-regression when B is not faster", () => {
    const row = debugRow(
      summarise(comparison({ deltaMs: 0 }), { preset: "known-regression", thresholdMs: 100 }),
    );
    assert.equal(row.verdict, "Not detected [0, 0]");
  });

  it("reports the resolution of an A/A run", () => {
    const row = debugRow(
      summarise(comparison({ deltaMs: 0 }), { preset: "aa-noise", thresholdMs: 100 }),
    );
    assert.equal(row.verdict, "OK: resolves about ±0 ms");
  });
});

describe("toMarkdown", () => {
  const options = {
    preset: "custom",
    labelA: "live-mobile@4.27.0",
    labelB: "release",
    thresholdMs: 100,
  };

  it("writes one table row per measure with its verdict", () => {
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 200 }), options), options);
    assert.match(markdown, /^### Startup time, custom: B − A$/m);
    assert.match(markdown, /^A = live-mobile@4\.27\.0 · B = release\.$/m);
    assert.match(
      markdown,
      /^\| android \| accounts \| Debug screen \| 6 \| .* \| FAIL: B is slower by more than 100 ms \|$/m,
    );
    assert.match(markdown, /^\| android \| accounts \| With native start \| 6 \| /m);
  });

  it("states the gate only for presets that gate B against A", () => {
    const aa = { ...options, preset: "aa-noise" };
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 0 }), aa), aa);
    assert.doesNotMatch(markdown, /B fails when/);
  });
});
