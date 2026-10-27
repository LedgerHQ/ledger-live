#!/usr/bin/env node
// Usage: query-datadog.mjs <request.json> [--dry-run]
// Counts matching spans in a window and a baseline. Prints a result JSON.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [requestPath, flag] = process.argv.slice(2);
if (!requestPath) {
  console.error("usage: query-datadog.mjs <request.json> [--dry-run]");
  process.exit(2);
}
const dryRun = flag === "--dry-run";

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, "..", "config", "datadog.json"), "utf8"));
const req = JSON.parse(readFileSync(requestPath, "utf8"));
const backend = config.backends[req.backend];
const { min_count, rate_factor, window_margin_minutes, baseline_hours } = config.thresholds;

if (!backend) {
  console.log(JSON.stringify({ run: entry("not_checked", `unknown backend: ${req.backend}`, "stg") }, null, 2));
  process.exit(0);
}

// Backend with a fixed env ignores the run environment
const runEnv = backend.fixed_env ?? config.run_environment_to_datadog[req.run_environment];
const envs = { run: runEnv };
if (req.check_prd) envs.prd = "prd";

function entry(result, reason, envUsed, extra = {}) {
  return { result, reason, env_used: envUsed, ...extra };
}

function buildQuery(envName) {
  const parts = [`env:${config.environments[envName].env_tag}`, `service:${backend.service}`];
  if (req.symptom.type === "http_status") parts.push(`${backend.facets.status}:${req.symptom.status}`);
  else parts.push("status:error");
  if (req.symptom.resource) parts.push(`resource_name:"${req.symptom.resource}"`);
  return parts.join(" ");
}

const startMs = Date.parse(req.window.start) - window_margin_minutes * 60_000;
const endMs = Date.parse(req.window.end) + window_margin_minutes * 60_000;
const baseStartMs = startMs - baseline_hours * 3_600_000;

function url(envName, query) {
  const host = config.environments[envName].app_host;
  return `https://${host}/apm/traces?query=${encodeURIComponent(query)}&start=${startMs}&end=${endMs}&view=spans&spanType=all`;
}

async function count(envName, query, fromMs, toMs) {
  const env = config.environments[envName];
  const res = await fetch(`https://${config.api_host}/api/v2/spans/analytics/aggregate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "DD-API-KEY": process.env[env.api_key_env],
      "DD-APPLICATION-KEY": process.env[env.app_key_env],
    },
    body: JSON.stringify({
      data: {
        type: "aggregate_request",
        attributes: {
          compute: [{ aggregation: "count", type: "total" }],
          filter: { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString(), query },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return Number(body?.data?.buckets?.[0]?.computes?.c0 ?? 0);
}

async function check(envName) {
  if (!backend.service) return entry("not_checked", "service not configured", envName);
  const query = buildQuery(envName);
  const base = { query, datadog_url: url(envName, query) };
  if (dryRun) return entry("not_checked", "dry run", envName, base);
  const env = config.environments[envName];
  if (!process.env[env.api_key_env] || !process.env[env.app_key_env]) {
    return entry("not_checked", `missing ${env.api_key_env} or ${env.app_key_env}`, envName, base);
  }
  try {
    const inWindow = await count(envName, query, startMs, endMs);
    const inBaseline = await count(envName, query, baseStartMs, startMs);
    const windowMin = (endMs - startMs) / 60_000;
    const rateWindow = inWindow / windowMin;
    const rateBase = inBaseline / (baseline_hours * 60);
    const ratio = rateBase > 0 ? rateWindow / rateBase : null;
    const numbers = {
      count_window: inWindow,
      count_baseline: inBaseline,
      window_minutes: Math.round(windowMin),
      baseline_hours,
      rate_ratio: ratio === null ? null : Number(ratio.toFixed(1)),
    };
    const found = inWindow >= min_count && (ratio === null || ratio >= rate_factor);
    return entry(found ? "found" : "not_found", found ? "symptom present in window" : "symptom absent or at baseline rate", envName, { ...base, numbers });
  } catch (e) {
    return entry("not_checked", `query failed: ${String(e.message ?? e).slice(0, 80)}`, envName, base);
  }
}

const out = {};
for (const [key, envName] of Object.entries(envs)) out[key] = await check(envName);
console.log(JSON.stringify(out, null, 2));
