#!/usr/bin/env node
// Usage: render-digest.mjs <run_dir>
// Prints a short per-platform list from findings.json and writes digest.txt.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const runDir = process.argv[2];
if (!runDir) {
  console.error("usage: render-digest.mjs <run_dir>");
  process.exit(2);
}

const { findings, skipped, left_out } = JSON.parse(readFileSync(join(runDir, "findings.json"), "utf8"));
const jobs = JSON.parse(readFileSync(join(runDir, "jobs.json"), "utf8"));
const envPath = join(runDir, "environment.json");
const env = existsSync(envPath) ? JSON.parse(readFileSync(envPath, "utf8")).environment : "unknown";

const LABEL = { desktop: "Desktop", ios: "iOS", android: "Android" };
const PRD = {
  confirmed: "confirmed",
  not_confirmed: "not confirmed",
  not_applicable: "not checked",
  not_checked: "not checked",
};
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const testName = t => short(t.replace(/ › /g, " > "), 90);

const flaky = findings.filter(f => f.outcome === "flaky").length;
const failed = findings.filter(f => f.outcome !== "flaky");
const lines = [`Run ${jobs.run_id} | ${jobs.workflow} | env: ${env} | ${jobs.branch}`, ""];

if (skipped === "no_failures") lines.push("No failed jobs.");
if (skipped === "no_domain_failures") lines.push(`No swap failures. ${left_out ?? 0} other failed tests left out by the filter.`);

for (const platform of ["desktop", "ios", "android"]) {
  const rows = failed.filter(f => f.platform === platform);
  if (!rows.length) continue;
  lines.push(`Platform ${LABEL[platform]}`);
  for (const f of rows) {
    const known = f.status === "known" ? "known" : "not known";
    const ticket = f.ticket?.key ? `${f.ticket.key}${f.ticket.created_by_agent ? " (new)" : ""}` : "none";
    const prd = PRD[f.prd?.status ?? "not_checked"];
    const cause = f.status === "not_confirmed" ? `${f.cause} (unconfirmed)` : f.cause;
    lines.push(`- ${testName(f.test)} | ${short(cause, 70)} | ${known} | ${ticket} | PRD: ${prd}`);
  }
  lines.push("");
}
if (flaky) lines.push(`Flaky (passed on retry): ${flaky}`);

const text = `${lines.join("\n").trimEnd()}\n`;
writeFileSync(join(runDir, "digest.txt"), text);
process.stdout.write(text);
