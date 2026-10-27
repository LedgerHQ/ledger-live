#!/usr/bin/env node
// Usage: write-investigation-context.mjs <output> <framework> <platform> <artifact-directory> <artifact-name>
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

const [output, framework, platform, directory, artifact] = process.argv.slice(2);
if (
  !output ||
  !["playwright", "detox"].includes(framework) ||
  !["desktop", "ios", "android"].includes(platform) ||
  !directory ||
  !artifact
) {
  console.error(
    "usage: write-investigation-context.mjs <output> <playwright|detox> <desktop|ios|android> <artifact-directory> <artifact-name>",
  );
  process.exit(2);
}

const runId = process.env.GITHUB_RUN_ID;
const repository = process.env.GITHUB_REPOSITORY;
const sha = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
if (!runId || !repository || !sha) {
  console.error("GITHUB_RUN_ID, GITHUB_REPOSITORY, and a checked-out Git revision are required");
  process.exit(2);
}

const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
const job = process.env.GITHUB_JOB ?? "unknown";
const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;
const context = {
  version: "1",
  run: {
    id: runId,
    url: runUrl,
    workflow: process.env.GITHUB_WORKFLOW ?? "unknown",
    head_sha: sha,
    job,
    framework,
    platform,
  },
  primary_workspace: {
    repository: "LedgerHQ/ledger-live",
    revision: sha,
    path: ".",
  },
  evidence: {
    workflow_log: runUrl,
    test_results: directory,
  },
  artifacts: {
    directory,
    names: [artifact],
  },
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(context, null, 2)}\n`);
