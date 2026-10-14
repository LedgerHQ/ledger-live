#!/usr/bin/env node
// MEASUREMENT BUILD ONLY, NEVER MERGE.
// Reads the `cv-probe` summary lines and `cv-probe-event` lines from any of:
// - a log file exported by the app (Settings > Help > Save logs), desktop or mobile;
// - the terminal output of the desktop app run with VERBOSE=cv-probe ELECTRON_ENABLE_LOGGING=1;
// - `adb logcat -s ReactNativeJS:I` output.
// Prints the totals, the hooks, one row per settings change (what the 15 s after it cost), one
// row per load, the restores and latest-rate drops, and the summary timeline.
// Usage: node cv-probe-parse.mjs <file> [--json]
import { readFileSync } from "node:fs";

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error("usage: node cv-probe-parse.mjs <file> [--json]");
  process.exit(2);
}

const KINDS = ["cv-probe-event ", "cv-probe "];

// The JSON object that starts at `from`, or null.
function jsonAt(text, from) {
  for (let end = text.lastIndexOf("}"); end > from; end = text.lastIndexOf("}", end - 1)) {
    try {
      return JSON.parse(text.slice(from, end + 1));
    } catch {
      // try a shorter span
    }
  }
  return null;
}

function fromMessage(message, at) {
  for (const prefix of KINDS) {
    const i = message.indexOf(prefix);
    if (i === -1) continue;
    const payload = jsonAt(message, i + prefix.length);
    if (!payload || typeof payload.seq !== "number") return null;
    return { kind: prefix.trim(), at, ...payload };
  }
  return null;
}

function fromExport(entries) {
  return entries
    .filter(e => e && e.type === "cv-probe" && typeof e.message === "string")
    .map(e => fromMessage(e.message, e.timestamp ?? e.date));
}

// Terminal lines: a whole log entry printed as JSON (desktop VERBOSE), or the bare line
// (console.log, as logcat shows it).
function fromText(text) {
  return text.split("\n").map(line => {
    if (!line.includes("cv-probe")) return null;
    const entryStart = line.indexOf('{"');
    const entry = entryStart === -1 ? null : jsonAt(line, entryStart);
    if (entry && entry.type === "cv-probe" && typeof entry.message === "string") {
      return fromMessage(entry.message, entry.timestamp);
    }
    const logcatTime = /^(\d\d-\d\d \d\d:\d\d:\d\d\.\d+)/.exec(line)?.[1];
    return fromMessage(line, logcatTime);
  });
}

const text = readFileSync(file, "utf8");
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  parsed = null;
}
const bySeq = new Map();
for (const s of Array.isArray(parsed) ? fromExport(parsed) : fromText(text)) {
  // A line can arrive twice (logger and console): keep one per sequence number.
  if (s && !bySeq.has(s.seq)) bySeq.set(s.seq, s);
}
const lines = [...bySeq.values()].sort((a, b) => a.seq - b.seq);
const summaries = lines.filter(l => l.kind === "cv-probe");
const events = lines.filter(l => l.kind === "cv-probe-event");

if (summaries.length === 0) {
  console.error("no cv-probe summary line in this file");
  process.exit(1);
}

const last = summaries[summaries.length - 1];
if (flag === "--json") {
  console.log(JSON.stringify({ last, summaries, events }, null, 2));
  process.exit(0);
}

const seqGaps = lines.length ? lines[lines.length - 1].seq - lines[0].seq + 1 - lines.length : 0;
const pct = (part, total) => (total ? `${((100 * part) / total).toFixed(1)}%` : "-");
const sec = ms => (ms == null ? "-" : (ms / 1000).toFixed(0));
const hookTotals = s =>
  Object.values(s.hooks).reduce(
    (t, h) => ({ renders: t.renders + h.renders, wasted: t.wasted + h.wasted }),
    { renders: 0, wasted: 0 },
  );
const table = (head, rows) => {
  console.log(`| ${head.join(" | ")} |`);
  console.log(`| ${head.map((_, i) => (i === 0 ? "---" : "---:")).join(" | ")} |`);
  for (const r of rows) console.log(`| ${r.join(" | ")} |`);
};

console.log(`probe base ${last.base}, loop ${last.loop ?? "provider (v1 probe)"}`);
console.log(
  `last summary: ${last.at}, reason ${last.reason}, elapsed ${sec(last.elapsedMs)} s` +
    (seqGaps ? `; WARNING: ${seqGaps} line(s) missing from the sequence` : ""),
);
if (last.loop === "provider" || last.loop === undefined) {
  console.log(
    `provider renders ${last.providerRenders}, bridge changes ${last.bridgeChanges}, polling loop renders ${last.effectRenders}`,
  );
}
console.log(
  last.commits
    ? `whole app: ${last.commits} commits, ${last.renderMs.toFixed(0)} ms of render`
    : "whole app: 0 commits (not a profiling build of React, or no <Profiler>)",
);
const boot = summaries.find(s => s.reason === "boot");
console.log(
  `loop starts ${last.loopStarts ?? "-"}, restores ${last.restores}, loads ${last.loads}; in the first 10 s: restores ${last.bootRestores}, loads ${last.bootLoads}` +
    (boot ? "" : " (no boot line: the capture missed the early lines)"),
);
if (last.historicalCalls !== undefined) {
  console.log(
    `rate requests: ${last.historicalCalls} history windows (${last.historicalDays.toFixed(0)} days), ${last.latestCalls} spot batches (${last.latestPairs} pairs)`,
  );
  console.log(
    `settings changes ${last.settingsChanges}; latest-rate drops ${last.latestDrops} (${last.latestPairsLost} pairs lost)\n`,
  );
}

table(
  ["hook", "renders", "wasted", "wasted %", "mounted", "peak"],
  Object.entries(last.hooks)
    .sort()
    .map(([name, s]) => [name, s.renders, s.wasted, pct(s.wasted, s.renders), s.mounted, s.peak]),
);

const changes = events.filter(e => e.event === "settings");
if (changes.length) {
  console.log("\nper settings change: the 15 s after it (from its two summaries)");
  const rows = changes.map(e => {
    const at = summaries.find(s => s.reason === "settings" && s.change === e.change);
    const after = summaries.find(s => s.reason === "settings+15s" && s.change === e.change);
    if (!at || !after)
      return [e.change, sec(e.sinceLoopStartMs), e.trackingPairs, "missing summary"];
    const d = key => after[key] - at[key];
    const [h0, h1] = [hookTotals(at), hookTotals(after)];
    return [
      e.change + (e.first ? " (first)" : ""),
      sec(e.sinceLoopStartMs),
      e.trackingPairs,
      d("commits"),
      d("renderMs").toFixed(0),
      h1.renders - h0.renders,
      h1.wasted - h0.wasted,
      d("bridgeChanges"),
      d("restores"),
      d("loads"),
      d("historicalCalls"),
      d("latestCalls"),
      d("latestPairsLost"),
    ];
  });
  table(
    [
      "change",
      "at s",
      "pairs",
      "commits",
      "render ms",
      "hook renders",
      "wasted",
      "bridge changes",
      "restores",
      "loads",
      "windows",
      "spot batches",
      "latest pairs lost",
    ],
    rows,
  );
}

const loads = events.filter(e => e.event === "load");
if (loads.length) {
  console.log("\nloads:");
  table(
    [
      "load",
      "at s",
      "pairs",
      "windows",
      "days",
      "max days",
      "spot batches",
      "spot pairs",
      "ms",
      "outcome",
    ],
    loads.map(e => [
      e.load,
      sec(e.sinceLoopStartMs),
      e.trackingPairs,
      e.windows,
      e.windowDays,
      e.windowDaysMax,
      e.spotCalls,
      e.spotPairs,
      e.durationMs,
      e.outcome,
    ]),
  );
}

const others = events.filter(e => !["settings", "load"].includes(e.event));
if (others.length) {
  console.log("\nrestores, latest-rate drops, loop starts, wipes:");
  for (const e of others) {
    const { kind, at, base, loop, seq, elapsedMs, sinceLoopStartMs, event, ...fields } = e;
    console.log(`- ${sec(sinceLoopStartMs)} s ${event} ${JSON.stringify(fields)}`);
  }
}

console.log("\ntimeline (cumulative):");
table(
  [
    "at",
    "reason",
    "elapsed s",
    "renders",
    "wasted",
    "bridge changes",
    "restores",
    "loads",
    "commits",
    "render ms",
  ],
  summaries.map(s => {
    const h = hookTotals(s);
    return [
      s.at,
      s.reason + (s.change ? ` #${s.change}` : ""),
      sec(s.elapsedMs),
      h.renders,
      h.wasted,
      s.bridgeChanges,
      s.restores,
      s.loads,
      s.commits ?? "-",
      s.renderMs?.toFixed(0) ?? "-",
    ];
  }),
);
