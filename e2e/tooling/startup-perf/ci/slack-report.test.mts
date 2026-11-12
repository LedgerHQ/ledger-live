import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  messageOf,
  outcomeOf,
  payloadOf,
  reportOf,
  type ResultRow,
  rowsIn,
  type RunReport,
} from "./slack-report.mts";

const row = (
  platform: string,
  scenario: string,
  measure: string,
  [estimate, low, high]: [number, number | null, number | null],
  verdict = "PASS",
): ResultRow => ({ platform, scenario, measure, hl: { estimate, low, high }, verdict });

const ROWS: ResultRow[] = [
  row("android", "no-accounts", "Debug screen", [-12.4, -40.2, 18.1]),
  row("android", "no-accounts", "With native start", [-8, -30, 15]),
  row("android", "accounts", "Debug screen", [4, -20, 30]),
  row("android", "accounts", "With native start", [5, -21, 31]),
  row("ios", "no-accounts", "Debug screen", [-21.6, -36.1, 6.5]),
  row("ios", "no-accounts", "With native start", [-21, -36, 7]),
  row("ios", "accounts", "Debug screen", [-15.8, -38.6, 14.1]),
  row("ios", "accounts", "With native start", [-15.7, -38.6, 14.1]),
];

const GREEN: RunReport = {
  event: "schedule",
  preset: "prod-vs-develop",
  thresholdMs: "100",
  labelA: "live-mobile@4.27.1 (4444444444)",
  labelB: "develop (1111111111)",
  scenarios: ["no-accounts", "accounts"],
  runUrl: "https://github.com/LedgerHQ/ledger-live/actions/runs/1",
  jobs: {
    plan: "success",
    android: { build: "success", measure: "success" },
    ios: { build: "success", measure: "success" },
  },
  rows: ROWS,
};

const withJobs = (jobs: Partial<RunReport["jobs"]>, rows = ROWS): RunReport => ({
  ...GREEN,
  jobs: { ...GREEN.jobs, ...jobs },
  rows,
});

describe("messageOf", () => {
  it("reports a green nightly in the E2E reports' layout", () => {
    const { outcome, header, lines, footer } = messageOf(GREEN);
    assert.equal(outcome, "passed");
    assert.equal(
      header,
      ":ledger-logo: Ledger Live Mobile startup performance nightly results on develop (1111111111) - vs live-mobile@4.27.1 (4444444444)",
    );
    assert.deepEqual(lines, [
      "🤖 Android · no-accounts : ✅ PASS · B − A -12 ms [-40, +18]",
      "🤖 Android · accounts : ✅ PASS · B − A +4 ms [-20, +30]",
      "🍏 iOS · no-accounts : ✅ PASS · B − A -22 ms [-36, +7]",
      "🍏 iOS · accounts : ✅ PASS · B − A -16 ms [-39, +14]",
    ]);
    assert.equal(
      footer,
      "prod-vs-develop · fails when B is slower by more than 100 ms · Debug screen B − A [95% interval]   ·   <https://github.com/LedgerHQ/ledger-live/actions/runs/1|⚙️ Workflow run>",
    );
  });

  it("adds the native start's result when its verdict differs, and fails the run", () => {
    const fail = "FAIL: B is slower by more than 100 ms";
    const rows = ROWS.map(r =>
      r.platform === "ios" && r.scenario === "accounts" && r.measure === "Debug screen"
        ? { ...r, hl: { estimate: 130, low: 105, high: 160 }, verdict: fail }
        : r,
    );
    const { outcome, lines } = messageOf(
      withJobs({ ios: { build: "success", measure: "failure" } }, rows),
    );
    assert.equal(outcome, "failed");
    assert.equal(
      lines.at(-1),
      `🍏 iOS · accounts : ❌ ${fail} · B − A +130 ms [+105, +160] · With native start: ✅ PASS · B − A -16 ms [-39, +14]`,
    );
  });

  const inconclusive = (verdict: string, [low, high]: [number, number]) =>
    `${verdict} (inconclusive: [${low}, ${high}] contains 100 ms)`;

  it("shows a FAIL whose interval holds the threshold as probably slower, without a job line", () => {
    const fail = (interval: [number, number]) =>
      inconclusive("FAIL: B is slower by more than 100 ms", interval);
    const rows = [
      row("android", "no-accounts", "Debug screen", [181, 40, 478], fail([40, 478])),
      row("android", "no-accounts", "With native start", [172, 32, 485], fail([32, 485])),
    ];
    const report = withJobs(
      {
        android: { build: "success", measure: "failure" },
        ios: { build: "skipped", measure: "skipped" },
      },
      rows,
    );
    const { outcome, lines } = messageOf({ ...report, scenarios: ["no-accounts"] });
    assert.equal(outcome, "inconclusive");
    assert.deepEqual(lines, [
      "🤖 Android · no-accounts : ⚠️ Probably slower by more than 100 ms · B − A +181 ms [+40, +478]",
    ]);
  });

  it("shows a PASS whose interval holds the threshold as probably within it", () => {
    const rows = ROWS.map(r =>
      r.platform === "android" && r.scenario === "accounts" && r.measure === "Debug screen"
        ? {
            ...r,
            hl: { estimate: 41, low: -29.25, high: 108.75 },
            verdict: inconclusive("PASS", [-29, 109]),
          }
        : r,
    );
    const { outcome, lines } = messageOf(withJobs({}, rows));
    assert.equal(outcome, "inconclusive");
    assert.equal(
      lines[1],
      "🤖 Android · accounts : ⚠️ Probably within 100 ms · B − A +41 ms [-29, +109] · With native start: ✅ PASS · B − A +5 ms [-21, +31]",
    );
  });

  it("stays failed when a ❌ line sits next to a ⚠️ one", () => {
    const rows = ROWS.map(r => {
      if (r.platform !== "android" || r.measure !== "Debug screen") return r;
      return r.scenario === "accounts"
        ? { ...r, verdict: inconclusive("PASS", [-20, 130]) }
        : { ...r, verdict: "FAIL: B is slower by more than 100 ms" };
    });
    const report = withJobs({ android: { build: "success", measure: "failure" } }, rows);
    assert.equal(outcomeOf(report), "failed");
  });

  it("names the measure shown when the Debug screen row counts from the JS start", () => {
    const rows = ROWS.map(r =>
      r.measure === "Debug screen" ? { ...r, measure: "Debug screen, from JS start" } : r,
    );
    const { lines } = messageOf(withJobs({}, rows));
    assert.equal(
      lines[0],
      "🤖 Android · no-accounts : ✅ PASS · B − A -12 ms [-40, +18] (Debug screen, from JS start)",
    );
  });

  it("says a build did not finish instead of listing its scenarios", () => {
    const report = withJobs(
      { android: { build: "failure", measure: "skipped" } },
      ROWS.filter(r => r.platform === "ios"),
    );
    const { outcome, lines } = messageOf(report);
    assert.equal(outcome, "failed");
    assert.equal(lines[0], "🤖 Android : ❌ the build did not finish, so nothing was measured");
    assert.equal(lines.length, 3);
  });

  it("says which scenario has no result when a measure job timed out", () => {
    const report = withJobs(
      { android: { build: "success", measure: "cancelled" } },
      ROWS.filter(r => !(r.platform === "android" && r.scenario === "accounts")),
    );
    const { outcome, lines } = messageOf(report);
    assert.equal(outcome, "failed");
    assert.match(lines[0], /^🤖 Android · no-accounts : ✅ PASS/);
    assert.equal(
      lines[1],
      "🤖 Android · accounts : ❌ no result, the measurement timed out or was cancelled",
    );
  });

  it("leaves out a platform a dispatch did not select, and the nightly from its header", () => {
    const report = withJobs(
      { android: { build: "skipped", measure: "skipped" } },
      ROWS.filter(r => r.platform === "ios"),
    );
    const { outcome, header, lines } = messageOf({ ...report, event: "workflow_dispatch" });
    assert.equal(outcome, "passed");
    assert.match(header, /^:ledger-logo: Ledger Live Mobile startup performance results on /);
    assert.equal(lines.length, 2);
    assert.ok(lines.every(line => line.includes("iOS")));
  });

  it("reports a plan failure on its own", () => {
    const report = withJobs(
      {
        plan: "failure",
        android: { build: "skipped", measure: "skipped" },
        ios: { build: "skipped", measure: "skipped" },
      },
      [],
    );
    assert.deepEqual(messageOf(report), {
      outcome: "failed",
      header: ":ledger-logo: Ledger Live Mobile startup performance nightly results",
      lines: ["❌ The plan job could not resolve the builds"],
      footer: "<https://github.com/LedgerHQ/ledger-live/actions/runs/1|⚙️ Workflow run>",
    });
  });

  it("shows a thin phase's estimate without an interval", () => {
    const thin = "Not enough pairs: 2 before the device swap, 4 after (3 needed on each side)";
    const rows = [row("ios", "no-accounts", "Debug screen", [12, null, null], thin)];
    const report = withJobs(
      {
        android: { build: "skipped", measure: "skipped" },
        ios: { build: "success", measure: "failure" },
      },
      rows,
    );
    const { lines } = messageOf({ ...report, scenarios: ["no-accounts"] });
    assert.equal(lines[0], `🍏 iOS · no-accounts : ❌ ${thin} · B − A +12 ms`);
  });

  it("states known-regression's gate and greens a detected regression", () => {
    const notDetected = "Not detected: B − A is 20 ms [0, 40], not above 100 ms";
    const rows = [
      row("ios", "no-accounts", "Debug screen", [300, 260, 340], "Detected: B is 300 ms slower"),
      row("ios", "accounts", "Debug screen", [20, 0, 40], notDetected),
    ];
    const report = withJobs(
      {
        android: { build: "skipped", measure: "skipped" },
        ios: { build: "success", measure: "failure" },
      },
      rows,
    );
    const dispatch = { ...report, event: "workflow_dispatch", preset: "known-regression" };
    const { outcome, lines, footer } = messageOf(dispatch);
    assert.equal(outcome, "failed");
    assert.match(lines[0], /^🍏 iOS · no-accounts : ✅ Detected: B is 300 ms slower · /);
    assert.match(lines[1], /^🍏 iOS · accounts : ❌ Not detected: /);
    assert.match(footer, /^known-regression · fails when B is not slower by more than 100 ms · /);
  });

  it("states aa-noise's gate and keeps a biased setup green", () => {
    const rows = [
      row("ios", "no-accounts", "Debug screen", [3, -12, 18], "OK: resolves about ±15 ms"),
      row("ios", "accounts", "Debug screen", [25, 10, 40], "Biased: resolves about ±15 ms"),
    ];
    const report = withJobs({ android: { build: "skipped", measure: "skipped" } }, rows);
    const dispatch = { ...report, event: "workflow_dispatch", preset: "aa-noise" };
    const { outcome, lines, footer } = messageOf(dispatch);
    assert.equal(outcome, "passed");
    assert.ok(lines.every(line => line.includes(" : ✅ ")));
    assert.match(footer, /^aa-noise · fails only on too few pairs · /);
  });

  it("keeps the plain-text header verbatim and escapes the mrkdwn lines", () => {
    const label = "feat/a<b>&c (1111111111)";
    const { header, lines } = messageOf({
      ...GREEN,
      labelB: label,
      scenarios: ["a<b"],
      rows: [{ ...ROWS[0], scenario: "a<b" }],
    });
    assert.ok(header.includes(label));
    assert.match(lines[0], /^🤖 Android · a&lt;b : /);
  });

  it("keeps the header within Slack's 150 characters", () => {
    const { header } = messageOf({ ...GREEN, labelB: "x".repeat(200) });
    assert.equal(header.length, 150);
    assert.ok(header.endsWith("…"));
  });
});

describe("outcomeOf", () => {
  it("needs at least one platform measured", () => {
    const skipped = { build: "skipped", measure: "skipped" };
    assert.equal(outcomeOf(withJobs({ android: skipped, ios: skipped }, [])), "failed");
  });

  it("explains a measure job that failed or timed out after its rows all passed", () => {
    const report = withJobs({
      android: { build: "success", measure: "failure" },
      ios: { build: "success", measure: "cancelled" },
    });
    const { outcome, lines } = messageOf(report);
    assert.equal(outcome, "failed");
    assert.deepEqual(
      lines.filter(line => line.includes("❌")),
      [
        "🤖 Android : ❌ the measurement job failed after enough pairs, see its log",
        "🍏 iOS : ❌ the measurement timed out or was cancelled after enough pairs",
      ],
    );
    assert.equal(lines.length, 6);
  });

  it("needs a result for every measured scenario, even when its jobs succeeded", () => {
    const report = withJobs(
      {},
      ROWS.filter(r => !(r.platform === "android" && r.scenario === "accounts")),
    );
    const { outcome, lines } = messageOf(report);
    assert.equal(outcome, "failed");
    assert.equal(
      lines[1],
      "🤖 Android · accounts : ❌ no result, its summary.json could not be downloaded, see the Slack report job log",
    );
  });
});

describe("payloadOf", () => {
  type Block = { type: string; text?: { text: string }; elements?: Array<{ text: string }> };
  type Payload = {
    channel: string;
    text: string;
    attachments: Array<{ color: string; fallback: string; blocks: Block[] }>;
  };

  it("posts a colored attachment like the E2E reports, with the whole report as its fallback", () => {
    const payload = payloadOf(GREEN, "C123") as Payload;
    const { header, lines, footer } = messageOf(GREEN);
    const [attachment] = payload.attachments;
    assert.equal(payload.channel, "C123");
    assert.equal(payload.text, " ");
    assert.equal(attachment.color, "#33FF39");
    assert.deepEqual(
      attachment.blocks.map(block => block.type),
      ["header", "divider", "section", "section", "section", "section", "divider", "context"],
    );
    assert.equal(attachment.blocks[0].text?.text, header);
    assert.deepEqual(
      attachment.blocks.filter(block => block.type === "section").map(block => block.text?.text),
      lines,
    );
    assert.equal(attachment.blocks.at(-1)?.elements?.[0].text, footer);
    assert.equal(
      attachment.fallback,
      [
        "Ledger Live Mobile startup performance nightly results on develop (1111111111) - vs live-mobile@4.27.1 (4444444444): passed",
        ...lines,
        "https://github.com/LedgerHQ/ledger-live/actions/runs/1",
      ].join("\n"),
    );
  });

  it("turns the bar red on a failed run", () => {
    const failed = withJobs({ android: { build: "failure", measure: "skipped" } });
    assert.equal((payloadOf(failed, "C123") as Payload).attachments[0].color, "#FF333C");
  });

  it("turns the bar yellow on an inconclusive run", () => {
    const verdict = "PASS (inconclusive: [-29, 109] contains 100 ms)";
    const inconclusive = withJobs(
      {},
      ROWS.map(r => ({ ...r, verdict })),
    );
    const [attachment] = (payloadOf(inconclusive, "C123") as Payload).attachments;
    assert.equal(attachment.color, "#FFCC33");
    assert.match(attachment.fallback, /: inconclusive\n/);
  });
});

describe("rowsIn", () => {
  it("reads every artifact's summary.json", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "slack-report-"));
    for (const [name, rows] of [
      ["startup-perf-results-android-no-accounts", ROWS.slice(0, 2)],
      ["startup-perf-results-ios", ROWS.slice(4)],
    ] as const) {
      mkdirSync(path.join(dir, name));
      writeFileSync(path.join(dir, name, "summary.json"), JSON.stringify(rows));
      writeFileSync(path.join(dir, name, "samples.jsonl"), "{}\n");
    }
    assert.equal(rowsIn(dir).length, 6);
  });

  it("finds nothing when no artifact was downloaded", () => {
    assert.deepEqual(rowsIn(path.join(tmpdir(), "slack-report-absent")), []);
  });
});

describe("reportOf", () => {
  it("reads the jobs' results and the plan's outputs", () => {
    const report = reportOf(
      {
        GITHUB_EVENT_NAME: "schedule",
        PRESET: "prod-vs-develop",
        THRESHOLD: "100",
        LABEL_A: "a",
        LABEL_B: "b",
        SCENARIOS: '["no-accounts","accounts"]',
        RUN_URL: "url",
        PLAN: "success",
        ANDROID_BUILD: "success",
        ANDROID_MEASURE: "cancelled",
        IOS_BUILD: "skipped",
        IOS_MEASURE: "skipped",
      },
      [],
    );
    assert.deepEqual(report.scenarios, ["no-accounts", "accounts"]);
    assert.deepEqual(report.jobs, {
      plan: "success",
      android: { build: "success", measure: "cancelled" },
      ios: { build: "skipped", measure: "skipped" },
    });
  });

  it("has no scenarios when the plan failed", () => {
    assert.deepEqual(reportOf({}, []).scenarios, []);
  });
});
