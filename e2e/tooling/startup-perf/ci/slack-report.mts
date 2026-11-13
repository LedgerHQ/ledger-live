#!/usr/bin/env node
// The Slack job: the message of a run, passed or failed, from the jobs' results and the summary.json
// the measure jobs' analysis wrote. Reads the environment and RESULTS_DIR; writes slack-payload.json,
// and slack-payload-secondary.json when SLACK_SECONDARY_CHANNEL is set.
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
  hl: { estimate: number; low: number | null; high: number | null } | null;
  verdict: string;
}

interface PlatformJobs {
  build: string;
  measure: string;
}

export interface RunReport {
  event: string;
  preset: string;
  thresholdMs: string;
  labelA: string;
  labelB: string;
  scenarios: string[];
  runUrl: string;
  jobs: { plan: string; android: PlatformJobs; ios: PlatformJobs };
  rows: ResultRow[];
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

function differenceOf(hl: ResultRow["hl"]): string {
  if (!hl) return "no pairs";
  const interval =
    hl.low === null || hl.high === null ? "" : ` [${signed(hl.low)}, ${signed(hl.high)}]`;
  return `${signed(hl.estimate)} ms${interval}`;
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
  thresholdMs: string,
): Line {
  const kindOf = (row: ResultRow) =>
    `${markOf(row.verdict)} ${headlineOf(row.verdict, thresholdMs).split(":")[0]}`;
  const resultOf = (row: ResultRow) =>
    `${markOf(row.verdict)} ${escaped(headlineOf(row.verdict, thresholdMs))} · B − A ${differenceOf(row.hl)}`;
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

const UNMEASURED: Record<string, string> = {
  cancelled: "the measurement timed out or was cancelled",
  success: "its summary.json could not be downloaded, see the Slack report job log",
};

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
  const unmeasured =
    UNMEASURED[jobs.measure] ?? "the measurement stopped before its analysis, see the job log";
  const scenarioLines = report.scenarios.map(scenario => {
    const rows = report.rows.filter(r => r.platform === platform.key && r.scenario === scenario);
    if (rows.length) return scenarioLine(platform, scenario, rows, report.thresholdMs);
    const label = `${platform.emoji} ${platform.name} · ${escaped(scenario)}`;
    return failure(`${label} : ❌ no result, ${unmeasured}`);
  });
  // The analysis runs even when the measurement stops early, so none of its rows may fail.
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

/** The message in the layout of the E2E reports (tools/actions/composites/e2e-slack-report). */
export function messageOf(report: RunReport): {
  outcome: Outcome;
  header: string;
  lines: string[];
  footer: string;
} {
  const run =
    report.event === "schedule"
      ? "Ledger Live Mobile startup performance nightly"
      : "Ledger Live Mobile startup performance";
  const planned = report.jobs.plan === "success";
  const header = planned
    ? `:ledger-logo: ${run} results on ${report.labelB} - vs ${report.labelA}`
    : `:ledger-logo: ${run} results`;
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

/** Every summary.json under `dir`, one folder per downloaded artifact; none when `dir` is absent. */
export function rowsIn(dir: string): ResultRow[] {
  let files: string[];
  try {
    files = readdirSync(dir, { recursive: true, encoding: "utf8" });
  } catch {
    return [];
  }
  return files
    .filter(file => path.basename(file) === "summary.json")
    .flatMap(file => JSON.parse(readFileSync(path.join(dir, file), "utf8")) as ResultRow[]);
}

export function reportOf(env: NodeJS.ProcessEnv, rows: ResultRow[]): RunReport {
  return {
    event: env.GITHUB_EVENT_NAME ?? "",
    preset: env.PRESET ?? "",
    thresholdMs: env.THRESHOLD ?? "",
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
  };
}

function main(): void {
  const env = process.env;
  if (!env.RESULTS_DIR) throw new StepFailure("RESULTS_DIR is not set");
  const report = reportOf(env, rowsIn(insideWorkingDir(env.RESULTS_DIR)));
  const files = payloadFilesOf(report, env);
  for (const [file, payload] of Object.entries(files)) {
    writeFileSync(insideWorkingDir(file), JSON.stringify(payload));
  }
  console.log(JSON.stringify(files["slack-payload.json"], null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runStep("slack-report", main);
}
