#!/usr/bin/env node
// Usage: validate-contract.mjs <input|output> <file.json>
// Lightweight validator for the skill's versioned wrapper contracts.
import { readFileSync } from "node:fs";

const [kind, path] = process.argv.slice(2);
if (!["input", "output"].includes(kind) || !path) {
  console.error("usage: validate-contract.mjs <input|output> <file.json>");
  process.exit(2);
}
const value = JSON.parse(readFileSync(path, "utf8"));
const errors = [];
const object = (x, label) => {
  if (!x || typeof x !== "object" || Array.isArray(x)) errors.push(`${label} must be an object`);
};
const required = (x, keys, label) =>
  keys.forEach(k => {
    if (!(k in (x ?? {}))) errors.push(`${label}.${k} is required`);
  });
object(value, "root");
if (value.version !== "1") errors.push('version must be "1"');
if (kind === "input") {
  required(value, ["version", "run", "domain", "policy"], "root");
  object(value.run, "run");
  object(value.policy, "policy");
  required(value.run, ["id"], "run");
  required(value.policy, ["jira_write_approved"], "policy");
  if (typeof value.policy?.jira_write_approved !== "boolean")
    errors.push("policy.jira_write_approved must be boolean");
} else {
  required(value, ["version", "run", "preflight", "findings", "summary"], "root");
  object(value.run, "run");
  object(value.preflight, "preflight");
  object(value.summary, "summary");
  required(value.preflight, ["availability", "adapter", "environment", "policy"], "preflight");
  required(value.summary, ["failed", "flaky", "left_out"], "summary");
  if (!Array.isArray(value.findings)) errors.push("findings must be an array");
  for (const [i, finding] of (value.findings ?? []).entries()) {
    required(finding, ["facts", "hypothesis", "confidence", "evidence", "gaps"], `findings[${i}]`);
    required(
      finding.facts,
      ["test", "platform", "environment", "run", "job", "outcome", "first_error"],
      `findings[${i}].facts`,
    );
    required(
      finding.hypothesis,
      ["cause_id", "cause", "verdict", "area"],
      `findings[${i}].hypothesis`,
    );
    required(finding.confidence, ["status"], `findings[${i}].confidence`);
    required(finding.gaps, ["attempts", "user_actions"], `findings[${i}].gaps`);
    if (finding.confidence?.status === "confirmed" && !finding.evidence?.length)
      errors.push(`findings[${i}].evidence required for confirmed`);
    if (finding.confidence?.status === "known" && !finding.confidence.ticket)
      errors.push(`findings[${i}].confidence.ticket required for known`);
    if (
      finding.hypothesis?.area === "backend" &&
      (!finding.confidence?.datadog_run || !finding.confidence?.prd)
    )
      errors.push(`findings[${i}].confidence.datadog_run and prd required for backend`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`${kind} contract valid: ${path}`);
