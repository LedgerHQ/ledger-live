#!/usr/bin/env node
// Usage: upload-attachments.mjs <ISSUE_KEY> <manifest.json> [--dry-run]
// Uploads files to a Jira issue. Credentials come from the environment only.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [key, manifestPath, flag] = process.argv.slice(2);
if (!key || !manifestPath) {
  console.error("usage: upload-attachments.mjs <ISSUE_KEY> <manifest.json> [--dry-run]");
  process.exit(2);
}
if (!/^LIVE-\d+$/.test(key)) {
  console.error(`refusing key outside LIVE: ${key}`);
  process.exit(2);
}

const dryRun = flag === "--dry-run";
const base = process.env.JIRA_BASE_URL ?? "https://ledgerhq.atlassian.net";
const { files } = JSON.parse(readFileSync(manifestPath, "utf8"));
const dir = dirname(manifestPath);

if (!dryRun && !(process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN)) {
  console.error("JIRA_EMAIL and JIRA_API_TOKEN must be set");
  process.exit(2);
}
const auth = dryRun ? "" : Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString("base64");

const results = [];
for (const f of files) {
  if (dryRun) {
    results.push({ file: f.file, ok: true, error: "dry run" });
    continue;
  }
  try {
    const form = new FormData();
    form.append("file", new Blob([readFileSync(join(dir, f.file))], { type: f.mime }), f.file);
    const res = await fetch(`${base}/rest/api/3/issue/${key}/attachments`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "X-Atlassian-Token": "no-check" },
      body: form,
    });
    results.push({ file: f.file, ok: res.ok, ...(res.ok ? {} : { error: `HTTP ${res.status}` }) });
  } catch (e) {
    results.push({ file: f.file, ok: false, error: String(e.message ?? e).slice(0, 120) });
  }
}

console.log(JSON.stringify(results, null, 2));
process.exit(results.every(r => r.ok) ? 0 : 1);
