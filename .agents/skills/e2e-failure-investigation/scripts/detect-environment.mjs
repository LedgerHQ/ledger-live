#!/usr/bin/env node
// Usage: detect-environment.mjs <run_dir>
// Reads logs and config/environments.json. Writes environment.json.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const runDir = process.argv[2];
if (!runDir) {
  console.error("usage: detect-environment.mjs <run_dir>");
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, "..", "config", "environments.json"), "utf8"));
const logsDir = join(runDir, "logs");
const text = readdirSync(logsDir)
  .filter(f => f.endsWith(".log"))
  .map(f => readFileSync(join(logsDir, f), "utf8"))
  .join("\n");

const find = re => text.match(new RegExp(re, "m"))?.[1] ?? null;
const sources = [];
let environment = null;

const swapBase = find(config.detection.log_swap_api_base.pattern);
if (swapBase) {
  const hit = Object.entries(config.environments).find(([, e]) => e.swap_api_base === swapBase);
  if (hit) {
    environment = hit[0];
    sources.push(`log SWAP_API_BASE=${swapBase}`);
  } else {
    sources.push(`log SWAP_API_BASE=${swapBase} (not in config)`);
  }
}

const firebase = config.detection.log_firebase_env.patterns.map(find).find(Boolean) ?? null;
if (firebase) sources.push(`log firebase env=${firebase}`);
if (!environment && firebase) environment = firebase === "production" || firebase === "js" ? "production" : "testing";
if (!environment) {
  environment = config.detection.workflow_default;
  sources.push("workflow default");
}

const mismatch = swapBase && firebase && config.environments[environment]?.firebase_env !== (firebase === "js" ? "production" : firebase);

writeFileSync(
  join(runDir, "environment.json"),
  JSON.stringify(
    {
      environment,
      settings: config.environments[environment],
      swap_api_base_seen: swapBase,
      firebase_env_seen: firebase,
      feature_flags: find("Feature Flags:\\*{0,2}\\s*(\\S+)"),
      speculos_mode: find("Speculos:\\*{0,2}\\s*([^\\n*]+)"),
      sources,
      mismatch: Boolean(mismatch),
      known_env_mismatches: config.known_env_mismatches,
    },
    null,
    2,
  ),
);
console.log(`environment: ${environment} (${sources.join("; ")})`);
