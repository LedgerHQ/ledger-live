#!/usr/bin/env node
// The Slack job: the message of a run, passed or failed, from the jobs' results and the
// summary.json and measurement.txt of each measure job. Reads the environment and RESULTS_DIR;
// writes slack-payload.json, and slack-payload-secondary.json when SLACK_SECONDARY_CHANNEL is set.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  insideWorkingDir,
  isFailingVerdict,
  isInconclusiveVerdict,
  runStep,
  StepFailure,
} from "./step.mts";

/** What the message shows of a line of summary.json (src/analysis/analyze.ts's Row). */
export interface ResultRow {
  platform: string;
  scenario: string;
  measure: string;
  pairs: number;
  hl: { estimate: number; low: number | null; high: number | null } | null;
  verdict: string;
}

/** A measure job's measurement.txt: its platform, its scenarios in order, its Measure step's outcome. */
export interface Measurement {
  platform: string;
  scenarios: string[];
  outcome: string;
}

interface PlatformJobs {
  build: string;
  measure: string;
}

export interface RunReport {
  event: string;
  preset: string;
  thresholdMs: string;
  /** The pairs per scenario the plan asked for, which the header gives. */
  pairs: string;
  labelA: string;
  labelB: string;
  scenarios: string[];
  runUrl: string;
  jobs: { plan: string; android: PlatformJobs; ios: PlatformJobs };
  rows: ResultRow[];
  measurements: Measurement[];
}

const PLATFORMS = [
  { key: "android", name: "Android", emoji: "🤖" },
  { key: "ios", name: "iOS", emoji: "🍏" },
] as const;

const UNFINISHED = new Set(["failure", "cancelled"]);

const escaped = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const signed = (ms: number) => {
  const rounded = Math.round(ms);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
};

const pairsOf = (count: number) => `${count} ${count === 1 ? "pair" : "pairs"}`;

/** B − A, with its own number of pairs when it is not the planned one. */
function differenceOf({ hl, pairs }: ResultRow, plannedPairs: string): string {
  if (!hl) return "no pairs";
  const interval =
    hl.low === null || hl.high === null ? "" : ` [${signed(hl.low)}, ${signed(hl.high)}]`;
  const count = pairs === Number(plannedPairs) ? "" : `, ${pairsOf(pairs)}`;
  return `${signed(hl.estimate)} ms${interval}${count}`;
}

type Mark = "✅" | "⚠️" | "❌";

interface Line {
  mark: Mark;
  /** A verdict that fails the measure job, so the job's failure needs no other line. */
  failing: boolean;
  text: string;
}

const markOf = (verdict: string): Mark => {
  if (isInconclusiveVerdict(verdict)) return "⚠️";
  return isFailingVerdict(verdict) ? "❌" : "✅";
};

const worstOf = (marks: Mark[]): Mark =>
  (["❌", "⚠️"] as const).find(mark => marks.includes(mark)) ?? "✅";

/** The verdict, or which side of the threshold B − A probably is when its interval holds it. */
function headlineOf(verdict: string, thresholdMs: string): string {
  if (!isInconclusiveVerdict(verdict)) return verdict;
  return isFailingVerdict(verdict)
    ? `Probably slower by more than ${thresholdMs} ms`
    : `Probably within ${thresholdMs} ms`;
}

// The value the manual check reads; the other measure shows only when its verdict differs.
const SHOWN_MEASURE = "Debug screen";

function scenarioLine(
  platform: (typeof PLATFORMS)[number],
  scenario: string,
  rows: ResultRow[],
  { thresholdMs, pairs }: Pick<RunReport, "thresholdMs" | "pairs">,
): Line {
  const kindOf = (row: ResultRow) =>
    `${markOf(row.verdict)} ${headlineOf(row.verdict, thresholdMs).split(":")[0]}`;
  const resultOf = (row: ResultRow) =>
    `${markOf(row.verdict)} ${escaped(headlineOf(row.verdict, thresholdMs))} · B − A ${differenceOf(row, pairs)}`;
  const shown = rows.find(row => row.measure.startsWith(SHOWN_MEASURE)) ?? rows[0];
  const shownMeasure = shown.measure === SHOWN_MEASURE ? "" : ` (${escaped(shown.measure)})`;
  const others = rows
    .filter(row => row !== shown && kindOf(row) !== kindOf(shown))
    .map(row => ` · ${escaped(row.measure)}: ${resultOf(row)}`);
  const label = `${platform.emoji} ${platform.name} · ${escaped(scenario)}`;
  return {
    mark: worstOf(rows.map(row => markOf(row.verdict))),
    failing: rows.some(row => isFailingVerdict(row.verdict)),
    text: `${label} : ${resultOf(shown)}${shownMeasure}${others.join("")}`,
  };
}

// Why a scenario has no rows, from its measure job's outcome.
const UNMEASURED = new Map([
  ["cancelled", "the measurement timed out or was cancelled"],
  ["skipped", "the measurement did not start, see the job log"],
  ["success", "its summary.json could not be downloaded or read, see the Slack report job log"],
]);

// A Measure step that did not finish, though its scenarios have rows.
const STOPPED = new Map([
  ["failure", "the measurement failed before the end, see the job log"],
  ["cancelled", "the measurement timed out or was cancelled before the end"],
]);

/**
 * Why the measure job of `scenario` stopped, when every scenario of that job has rows: it was on
 * its last one. A scenario without rows has its own line.
 */
function stopOf(report: RunReport, platform: string, scenario: string): string | undefined {
  const hasRows = (s: string) => report.rows.some(r => r.platform === platform && r.scenario === s);
  const stopped = report.measurements.find(
    m =>
      m.platform === platform &&
      STOPPED.has(m.outcome) &&
      m.scenarios.at(-1) === scenario &&
      m.scenarios.every(hasRows),
  );
  return stopped && STOPPED.get(stopped.outcome);
}

function platformLines(report: RunReport, platform: (typeof PLATFORMS)[number]): Line[] {
  const jobs = report.jobs[platform.key];
  const failure = (text: string): Line => ({ mark: "❌", failing: true, text });
  if (UNFINISHED.has(jobs.build)) {
    return [
      failure(
        `${platform.emoji} ${platform.name} : ❌ the build did not finish, so nothing was measured`,
      ),
    ];
  }
  if (jobs.build !== "success") return [];
  const scenarioLines = report.scenarios.map(scenario => {
    const rows = report.rows.filter(r => r.platform === platform.key && r.scenario === scenario);
    if (rows.length) {
      const line = scenarioLine(platform, scenario, rows, report);
      const stop = stopOf(report, platform.key, scenario);
      return stop ? failure(`${line.text} · ❌ ${stop}`) : line;
    }
    // The scenario's own job when it wrote measurement.txt; Android has one job per scenario.
    const outcome =
      report.measurements.find(m => m.platform === platform.key && m.scenarios.includes(scenario))
        ?.outcome ?? jobs.measure;
    const unmeasured =
      UNMEASURED.get(outcome) ??
      "the measurement stopped before this scenario finished, see the job log";
    const label = `${platform.emoji} ${platform.name} · ${escaped(scenario)}`;
    return failure(`${label} : ❌ no result, ${unmeasured}`);
  });
  // A measure job whose failure no line explains, as when it wrote no measurement.txt.
  const unexplained = UNFINISHED.has(jobs.measure) && !scenarioLines.some(line => line.failing);
  if (!unexplained) return scenarioLines;
  const why =
    jobs.measure === "cancelled"
      ? "the measurement timed out or was cancelled after enough pairs"
      : "the measurement job failed after enough pairs, see its log";
  return [...scenarioLines, failure(`${platform.emoji} ${platform.name} : ❌ ${why}`)];
}

function linesOf(report: RunReport): Line[] {
  return report.jobs.plan === "success"
    ? PLATFORMS.flatMap(platform => platformLines(report, platform))
    : [{ mark: "❌", failing: true, text: "❌ The plan job could not resolve the builds" }];
}

export type Outcome = "passed" | "inconclusive" | "failed";

/** Failed when nothing was measured or a line is ❌, else inconclusive when a line is ⚠️. */
export function outcomeOf(report: RunReport): Outcome {
  const marks = linesOf(report).map(line => line.mark);
  if (!marks.length || marks.includes("❌")) return "failed";
  return marks.includes("⚠️") ? "inconclusive" : "passed";
}

/** When a preset's run fails, as in the README's preset table. */
function gateOf(preset: string, thresholdMs: string): string {
  if (preset === "aa-noise") return "fails only on too few pairs";
  if (preset === "known-regression") {
    return `fails when B is not slower by more than ${thresholdMs} ms`;
  }
  return `fails when B is slower by more than ${thresholdMs} ms`;
}

// Slack cuts a plain_text header at this length.
const HEADER_MAX = 150;

function headerOf(report: RunReport): string {
  const run =
    report.event === "schedule"
      ? ":ledger-logo: Ledger Live Mobile startup performance nightly"
      : ":ledger-logo: Ledger Live Mobile startup performance";
  if (report.jobs.plan !== "success") return `${run} results`;
  const pairs = report.pairs ? ` · ${report.pairs} pairs` : "";
  // A/A measures one build twice: there is no B to name.
  if (report.preset === "aa-noise") return `${run} A/A results on ${report.labelA}${pairs}`;
  return `${run} results on ${report.labelB} - vs ${report.labelA}${pairs}`;
}

/** The message in the layout of the E2E reports (tools/actions/composites/e2e-slack-report). */
export function messageOf(report: RunReport): {
  outcome: Outcome;
  header: string;
  lines: string[];
  footer: string;
} {
  const planned = report.jobs.plan === "success";
  const header = headerOf(report);
  const runLink = `<${report.runUrl}|⚙️ Workflow run>`;
  const gate = gateOf(report.preset, report.thresholdMs);
  return {
    outcome: outcomeOf(report),
    header: header.length > HEADER_MAX ? `${header.slice(0, HEADER_MAX - 1)}…` : header,
    lines: linesOf(report).map(line => line.text),
    footer: planned
      ? `${escaped(report.preset)} · ${gate} · ${SHOWN_MEASURE} B − A [95% interval]   ·   ${runLink}`
      : runLink,
  };
}

const COLORS: Record<Outcome, string> = {
  passed: "#33FF39",
  inconclusive: "#FFCC33",
  failed: "#FF333C",
};

export function payloadOf(report: RunReport, channel: string): object {
  const { outcome, header, lines, footer } = messageOf(report);
  const fallback = [
    `${header.replace(":ledger-logo: ", "")}: ${outcome}`,
    ...lines,
    report.runUrl,
  ].join("\n");
  return {
    channel,
    // As in the E2E reports: the attachment holds the message, so a text would show it twice.
    text: " ",
    attachments: [
      {
        color: COLORS[outcome],
        fallback,
        blocks: [
          { type: "header", text: { type: "plain_text", text: header, emoji: true } },
          { type: "divider" },
          ...lines.map(line => ({ type: "section", text: { type: "mrkdwn", text: line } })),
          { type: "divider" },
          { type: "context", elements: [{ type: "mrkdwn", text: footer }] },
        ],
      },
    ],
  };
}

/** Each channel's payload by file name, the same message in both, as in the mobile E2E reports. */
export function payloadFilesOf(report: RunReport, env: NodeJS.ProcessEnv): Record<string, object> {
  const payload = payloadOf(report, env.SLACK_CHANNEL ?? "");
  const secondary = env.SLACK_SECONDARY_CHANNEL;
  return {
    "slack-payload.json": payload,
    ...(secondary ? { "slack-payload-secondary.json": { ...payload, channel: secondary } } : {}),
  };
}

/** A measurement.txt line, which the measure job writes: `<platform> <scenario,…> <outcome>`. */
export function measurementOf(text: string): Measurement {
  const [platform, scenarios, outcome, ...rest] = text.trim().split(" ");
  if (!platform || !scenarios || !outcome || rest.length) {
    throw new Error(`not "<platform> <scenarios> <outcome>": ${text.trim()}`);
  }
  return { platform, scenarios: scenarios.split(","), outcome };
}

function summaryOf(text: string): ResultRow[] {
  const rows: unknown = JSON.parse(text);
  if (!Array.isArray(rows)) throw new Error("not a list of rows");
  return rows as ResultRow[];
}

/** A file's contents, or nothing with a warning: one unreadable artifact leaves out its lines only. */
function readOrWarn<T>(file: string, parse: (text: string) => T): T[] {
  try {
    return [parse(readFileSync(file, "utf8"))];
  } catch (error) {
    console.log(`::warning::startup-perf slack-report: left out ${file}: ${String(error)}`);
    return [];
  }
}

export type Results = Pick<RunReport, "rows" | "measurements">;

/** Every summary.json and measurement.txt under `dir`, a folder per artifact; none without `dir`. */
export function resultsIn(dir: string): Results {
  let files: string[];
  try {
    files = readdirSync(dir, { recursive: true, encoding: "utf8" });
  } catch {
    return { rows: [], measurements: [] };
  }
  const named = (name: string) =>
    files.filter(file => path.basename(file) === name).map(file => path.join(dir, file));
  return {
    rows: named("summary.json").flatMap(file => readOrWarn(file, summaryOf).flat()),
    measurements: named("measurement.txt").flatMap(file => readOrWarn(file, measurementOf)),
  };
}

export function reportOf(env: NodeJS.ProcessEnv, { rows, measurements }: Results): RunReport {
  return {
    event: env.GITHUB_EVENT_NAME ?? "",
    preset: env.PRESET ?? "",
    thresholdMs: env.THRESHOLD ?? "",
    pairs: env.PAIRS ?? "",
    labelA: env.LABEL_A ?? "",
    labelB: env.LABEL_B ?? "",
    scenarios: env.SCENARIOS ? (JSON.parse(env.SCENARIOS) as string[]) : [],
    runUrl: env.RUN_URL ?? "",
    jobs: {
      plan: env.PLAN ?? "",
      android: { build: env.ANDROID_BUILD ?? "", measure: env.ANDROID_MEASURE ?? "" },
      ios: { build: env.IOS_BUILD ?? "", measure: env.IOS_MEASURE ?? "" },
    },
    rows,
    measurements,
  };
}

function main(): void {
  const env = process.env;
  if (!env.RESULTS_DIR) throw new StepFailure("RESULTS_DIR is not set");
  const report = reportOf(env, resultsIn(insideWorkingDir(env.RESULTS_DIR)));
  const files = payloadFilesOf(report, env);
  for (const [file, payload] of Object.entries(files)) {
    writeFileSync(insideWorkingDir(file), JSON.stringify(payload));
  }
  console.log(JSON.stringify(files["slack-payload.json"], null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runStep("slack-report", main);
}
