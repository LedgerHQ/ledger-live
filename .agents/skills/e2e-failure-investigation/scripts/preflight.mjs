#!/usr/bin/env node
// Usage: preflight.mjs <input.json> <run_dir>
// Writes the required structured preflight output without contacting external services.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const [inputPath, runDir] = process.argv.slice(2);
if (!inputPath || !runDir) {
  console.error("usage: preflight.mjs <input.json> <run_dir>");
  process.exit(2);
}

const input = JSON.parse(readFileSync(inputPath, "utf8"));
const githubDisabled = input.adapters?.github_actions === "disabled";
const ghAvailable =
  !githubDisabled && spawnSync("gh", ["--version"], { stdio: "ignore" }).status === 0;
const adapter = githubDisabled
  ? "disabled by input"
  : ghAvailable
    ? "gh CLI"
    : "gh CLI unavailable";
const kodaRequested = input.adapters?.koda_mcp !== "disabled";
const output = {
  version: "1",
  run_id: input.run.id,
  availability: {
    github_actions: githubDisabled ? "not_requested" : ghAvailable ? "available" : "unavailable",
    koda_mcp: kodaRequested ? "unavailable" : "not_requested",
  },
  adapter: {
    github_actions: adapter,
    koda_mcp: kodaRequested ? "not detected by this repository skill" : "disabled by input",
  },
  environment: { status: "unknown", value: "unknown", sources: [] },
  policy: {
    collection: "read_only_automatic",
    jira_writes: input.policy.jira_write_approved ? "approved" : "requires_explicit_approval",
  },
};
mkdirSync(runDir, { recursive: true });
writeFileSync(join(runDir, "preflight.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
