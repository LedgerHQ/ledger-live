#!/usr/bin/env node
// MEASUREMENT BUILD ONLY, NEVER MERGE.
// Reads a log file exported by the desktop (Settings > Help > Save logs) or mobile app, keeps the
// `cv-probe` summary lines and prints the last one as a table per hook, plus the timeline.
// Usage: node cv-probe-parse.mjs <exported-logs.txt> [--json]
import { readFileSync } from "node:fs";

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error("usage: node cv-probe-parse.mjs <exported-logs.txt> [--json]");
  process.exit(2);
}

const entries = JSON.parse(readFileSync(file, "utf8"));
const PREFIX = "cv-probe ";
const summaries = entries
  .filter(e => e && e.type === "cv-probe" && typeof e.message === "string")
  .map(e => ({
    at: e.timestamp ?? e.date,
    ...JSON.parse(e.message.slice(e.message.indexOf(PREFIX) + PREFIX.length)),
  }))
  .sort((a, b) => String(a.at).localeCompare(String(b.at)));

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
