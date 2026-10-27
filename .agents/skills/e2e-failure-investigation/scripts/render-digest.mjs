#!/usr/bin/env node
// Usage: render-digest.mjs <run_dir>
// Reads canonical investigation.json, prints a short per-platform digest and writes digest.txt.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const runDir = process.argv[2];
if (!runDir) {
  console.error("usage: render-digest.mjs <run_dir>");
  process.exit(2);
}

const resultPath = join(runDir, "investigation.json");
const result = JSON.parse(readFileSync(resultPath, "utf8"));
const { findings, summary, run } = result;
const LABEL = { desktop: "Desktop", ios: "iOS", android: "Android" };
const PRD = {
  confirmed: "confirmed",
  not_confirmed: "not confirmed",
  not_applicable: "not checked",
  not_checked: "not checked",
};
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const testName = t => short(t.replace(/ › /g, " > "), 90);
const failed = findings.filter(f => f.facts.outcome !== "flaky");
const flaky = findings.length - failed.length;
const lines = [
  `Run ${run.id} | ${run.workflow ?? "unknown workflow"} | env: ${run.environment} | ${run.branch ?? "unknown branch"}`,
  "",
];

if (summary.skipped === "no_failures") lines.push("No failed jobs.");
if (summary.skipped === "no_domain_failures")
  lines.push(`No domain failures. ${summary.left_out} other failed tests left out by the filter.`);
for (const platform of ["desktop", "ios", "android"]) {
  const rows = failed.filter(f => f.facts.platform === platform);
  if (!rows.length) continue;
  lines.push(`Platform ${LABEL[platform]}`);
  for (const f of rows) {
    const ticket = f.confidence.ticket?.key ?? "none";
    const known = f.confidence.status === "known" ? "known" : "not known";
    const cause =
      f.confidence.status === "not_confirmed"
        ? `${f.hypothesis.cause} (unconfirmed)`
        : f.hypothesis.cause;
    lines.push(
      `- ${testName(f.facts.test)} | ${short(cause, 70)} | ${known} | ${ticket} | PRD: ${PRD[f.confidence.prd?.status ?? "not_checked"]}`,
    );
  }
  lines.push("");
}
if (flaky) lines.push(`Flaky (passed on retry): ${flaky}`);
const text = `${lines.join("\n").trimEnd()}\n`;
writeFileSync(join(runDir, "digest.txt"), text);
process.stdout.write(text);
