#!/usr/bin/env node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), "e2e-investigation-contract-"));
const input = join(dir, "input.json");
const runDir = join(dir, "run");
writeFileSync(
  input,
  JSON.stringify({
    version: "1",
    run: { id: 1 },
    domain: "swap",
    policy: { jira_write_approved: false },
  }),
);
const run = (script, args) => {
  const result = spawnSync("node", [join(root, "scripts", script), ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
};
try {
  run("validate-contract.mjs", ["input", input]);
  run("preflight.mjs", [input, runDir]);
  const preflight = JSON.parse(readFileSync(join(runDir, "preflight.json")));
  if (preflight.policy.jira_writes !== "requires_explicit_approval")
    throw new Error("write policy was not retained");
  mkdirSync(join(runDir, "logs"), { recursive: true });
  writeFileSync(join(runDir, "logs", "failed.log"), "Firebase env to target: testing\n");
  run("detect-environment.mjs", [runDir]);
  const updatedPreflight = JSON.parse(readFileSync(join(runDir, "preflight.json")));
  if (updatedPreflight.environment.value !== "testing")
    throw new Error("environment was not copied to preflight");
  const output = join(dir, "output.json");
  writeFileSync(
    output,
    JSON.stringify({
      version: "1",
      run: { id: 1, environment: "unknown" },
      preflight: updatedPreflight,
      findings: [],
      summary: { failed: 0, flaky: 0, left_out: 0, skipped: "no_failures" },
    }),
  );
  run("validate-contract.mjs", ["output", output]);
  console.log("contract tests passed");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
