#!/usr/bin/env node
// MEASUREMENT BUILD ONLY, NEVER MERGE.
// Reads the `cv-probe` summary lines from any of:
// - a log file exported by the app (Settings > Help > Save logs), desktop or mobile;
// - the terminal output of the desktop app run with VERBOSE=cv-probe ELECTRON_ENABLE_LOGGING=1;
// - `adb logcat -s ReactNativeJS:I` output.
// Prints the last summary as a table per hook, plus the timeline.
// Usage: node cv-probe-parse.mjs <file> [--json]
import { readFileSync } from "node:fs";

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error("usage: node cv-probe-parse.mjs <file> [--json]");
  process.exit(2);
}

const PREFIX = "cv-probe ";

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
  const i = message.indexOf(PREFIX);
  const payload = i === -1 ? null : jsonAt(message, i + PREFIX.length);
  return payload && typeof payload.seq === "number" ? { at, ...payload } : null;
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
    if (!line.includes(PREFIX)) return null;
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
const summaries = [...bySeq.values()].sort((a, b) => a.seq - b.seq);

if (summaries.length === 0) {
  console.error("no cv-probe line in this file");
  process.exit(1);
}

const last = summaries[summaries.length - 1];
if (flag === "--json") {
  console.log(JSON.stringify({ last, timeline: summaries }, null, 2));
  process.exit(0);
}

const pct = (part, total) => (total ? `${((100 * part) / total).toFixed(1)}%` : "-");
const boot = summaries.find(s => s.reason === "boot");
console.log(`probe base ${last.base}`);
console.log(
  `last summary: ${last.at}, reason ${last.reason}, elapsed ${(last.elapsedMs / 1000).toFixed(0)} s`,
);
console.log(
  `provider renders ${last.providerRenders}, bridge changes ${last.bridgeChanges}, polling loop renders ${last.effectRenders}`,
);
console.log(
  last.commits
    ? `whole tree: ${last.commits} commits, ${last.renderMs.toFixed(0)} ms of render`
    : "whole tree: 0 commits (not a profiling build of React, or a probe without the <Profiler>)",
);
console.log(
  `restores ${last.restores}, loads ${last.loads}; in the first 10 s after mount: restores ${last.bootRestores}, loads ${last.bootLoads}` +
    (boot ? "" : " (no boot line: exported logs dropped the early entries)") +
    "\n",
);
console.log("| hook | renders | wasted | wasted % | mounted | peak |");
console.log("| --- | ---: | ---: | ---: | ---: | ---: |");
for (const [name, s] of Object.entries(last.hooks).sort()) {
  console.log(
    `| ${name} | ${s.renders} | ${s.wasted} | ${pct(s.wasted, s.renders)} | ${s.mounted} | ${s.peak} |`,
  );
}

console.log("\ntimeline (cumulative):");
console.log(
  "| at | reason | elapsed s | renders | wasted | bridge changes | restores | loads | commits | render ms |",
);
console.log("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const s of summaries) {
  const hooks = Object.values(s.hooks);
  const renders = hooks.reduce((n, h) => n + h.renders, 0);
  const wasted = hooks.reduce((n, h) => n + h.wasted, 0);
  console.log(
    `| ${s.at} | ${s.reason} | ${(s.elapsedMs / 1000).toFixed(0)} | ${renders} | ${wasted} | ${s.bridgeChanges} | ${s.restores} | ${s.loads} | ${s.commits ?? "-"} | ${s.renderMs?.toFixed(0) ?? "-"} |`,
  );
}
