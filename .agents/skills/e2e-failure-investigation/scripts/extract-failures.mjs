#!/usr/bin/env node
// Usage: extract-failures.mjs <run_dir>
// Reads jobs.json and logs/*.log. Writes failures.json, one row per failed test.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const runDir = process.argv[2];
if (!runDir) {
  console.error("usage: extract-failures.mjs <run_dir>");
  process.exit(2);
}

const jobs = JSON.parse(readFileSync(join(runDir, "jobs.json"), "utf8"));
const failures = [];

const platformOf = name => (/ios/i.test(name) ? "ios" : /android/i.test(name) ? "android" : "desktop");
const deviceOf = name => name.match(/\(([^)]+)\)/)?.[1] ?? null;
const stripTags = s => s.replace(/\s@[\w-]+/g, "").trim();

// Playwright ends with "N failed" and "N flaky" lists
function summarySection(lines, header) {
  const start = lines.findIndex(l => new RegExp(`^(##\\[notice\\])?\\s+\\d+ ${header}\\s*$`).test(l));
  if (start < 0) return new Set();
  const keys = new Set();
  for (const l of lines.slice(start + 1)) {
    const m = l.match(/^\s+(\S+?):(\d+):\d+ › (.+)$/);
    if (!m) break;
    keys.add(`${m[1]}:${m[2]}|${m[3].split(" › ").map(stripTags).join(" › ")}`);
  }
  return keys;
}

// Error blocks read "##[error]  N) file:line:col › title › step"
function parsePlaywright(lines, job) {
  const rows = new Map();
  const flaky = summarySection(lines, "flaky");
  lines.forEach((line, i) => {
    const m = line.match(/^##\[error\]\s+\d+\)\s+(\S+?):(\d+):\d+ › (.+)$/);
    if (!m) return;
    const parts = m[3].split(" › ").map(stripTags);
    const key = `${m[1]}:${m[2]}|${parts.slice(0, -1).join(" › ")}`;
    const body = lines.slice(i + 1, i + 12).filter(l => l.trim());
    const errorLine = body.find(l => /Error|Timeout/.test(l))?.trim() ?? body[0]?.trim() ?? "";
    const retry = lines.slice(i + 1, i + 40).some(l => /Retry #1/.test(l));
    const row = rows.get(key) ?? {
      test: parts.slice(0, -1).join(" › "),
      file: m[1],
      line: Number(m[2]),
      failing_step: parts.at(-1),
      first_error: errorLine,
      log_line: i + 1,
      retried: false,
      outcome: [...flaky].some(k => key === k || key.startsWith(`${k} › `)) ? "flaky" : "failed",
    };
    row.retried ||= retry;
    rows.set(key, row);
  });
  return [...rows.values()].map(r => ({ ...r, job_id: job.id, framework: "playwright" }));
}

// Detox prints "FAIL specs/x.spec.ts" and "● Suite › test" blocks
function parseDetox(lines, job) {
  const rows = new Map();
  let file = null;
  lines.forEach((line, i) => {
    const f = line.match(/^\s*FAIL\s+(specs\/\S+)/);
    if (f) file = f[1];
    const m = line.match(/^\s+● (.+ › .+)$/);
    if (!m) return;
    const body = lines.slice(i + 1, i + 14).filter(l => l.trim());
    const key = m[1];
    const row = rows.get(key) ?? {
      test: m[1],
      file,
      line: null,
      failing_step: null,
      first_error: body[0]?.trim() ?? "",
      log_line: i + 1,
      retried: false,
      outcome: "failed",
    };
    row.retried = rows.has(key);
    rows.set(key, row);
  });
  return [...rows.values()].map(r => ({ ...r, job_id: job.id, framework: "detox" }));
}

for (const job of jobs.failed_jobs) {
  const path = join(runDir, "logs", `${job.id}.log`);
  if (!existsSync(path)) continue;
  const lines = readFileSync(path, "utf8").split("\n");
  const platform = platformOf(job.name);
  const rows = platform === "desktop" ? parsePlaywright(lines, job) : parseDetox(lines, job);
  for (const r of rows) {
    failures.push({ ...r, platform, device: deviceOf(job.name), job_name: job.name });
  }
}

writeFileSync(join(runDir, "failures.json"), JSON.stringify({ run_id: jobs.run_id, failures }, null, 2));
console.log(`extracted ${failures.length} failed test(s) from ${jobs.failed_jobs.length} job(s)`);
