// Fails on a stale or incomplete entry of an app's coin-families-exceptions.json. The file holds the reason
// why a file stays in a generic folder; the baseline (oxlint-suppressions.json) cannot hold one.
// Rationale: support/lint/README.md#coin-families-exceptions.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const EXCEPTIONS_FILE = "coin-families-exceptions.json";
const BASELINE_FILE = "oxlint-suppressions.json";
const RULE_PREFIX = "coin-families/";
const RULES = new Set(["no-coin-specific-import", "no-family-branch", "no-currency-id-branch"]);
const KINDS = new Set(["accepted", "temporary"]);

/** @param {unknown} value */
const isText = value => typeof value === "string" && value.trim() !== "";

/**
 * @param {string} file
 * @returns {unknown}
 */
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * @param {Record<string, unknown>} entry
 * @returns {string[]} what is missing or unknown in the entry itself, without reading the app
 */
function shapeProblems(entry) {
  if (!KINDS.has(/** @type {string} */ (entry.kind))) {
    return [`kind must be one of ${[...KINDS].join(", ")}`];
  }
  const problems = [];
  if (entry.kind === "accepted") {
    if (!isText(entry.owner)) problems.push("an accepted entry needs an owner");
    if (!isText(entry.reason)) problems.push("an accepted entry needs a reason");
  } else if (!isText(entry.reason) && !isText(entry.ticket)) {
    problems.push("a temporary entry needs a reason or a ticket");
  }

  const rules = entry.rules ?? [];
  if (!Array.isArray(rules)) return [...problems, "rules must be an array"];
  for (const rule of rules) {
    if (!RULES.has(rule)) problems.push(`unknown rule ${String(rule)}`);
  }
  return problems;
}

/**
 * @param {string} appDir the app root, holding both files
 * @returns {string[]} one line per problem, `file: what`
 */
export function findProblems(appDir) {
  const exceptionsPath = path.join(appDir, EXCEPTIONS_FILE);
  const entries = readJson(exceptionsPath);
  if (!Array.isArray(entries)) return [`${exceptionsPath}: the file must hold an array`];

  const baseline = /** @type {Record<string, Record<string, unknown>>} */ (
    readJson(path.join(appDir, BASELINE_FILE))
  );
  const problems = [];
  const seen = new Set();

  for (const entry of entries) {
    const label = `${path.join(appDir, String(entry?.file))}`;
    if (!isText(entry?.file)) {
      problems.push(`${exceptionsPath}: an entry has no file`);
      continue;
    }
    if (seen.has(entry.file)) problems.push(`${label}: listed twice`);
    seen.add(entry.file);

    for (const problem of shapeProblems(entry)) problems.push(`${label}: ${problem}`);
    if (!fs.existsSync(path.join(appDir, entry.file))) {
      problems.push(`${label}: the file does not exist, remove its entry`);
    }
    const listed = Array.isArray(entry.rules) ? entry.rules : [];
    for (const rule of listed) {
      if (!RULES.has(rule)) continue;
      if (baseline[entry.file]?.[`${RULE_PREFIX}${rule}`] === undefined) {
        problems.push(
          `${label}: ${rule} no longer reports it in ${BASELINE_FILE}, remove the rule from its entry`,
        );
      }
    }
    for (const rule of RULES) {
      if (baseline[entry.file]?.[`${RULE_PREFIX}${rule}`] !== undefined && !listed.includes(rule)) {
        problems.push(
          `${label}: ${rule} reports it in ${BASELINE_FILE}, add the rule to its entry`,
        );
      }
    }
  }
  return problems;
}

function main(appDirs) {
  const problems = appDirs.flatMap(findProblems);
  if (problems.length === 0) return 0;

  console.error(
    `Stale or incomplete coin-families exceptions. Each app lists them in ${EXCEPTIONS_FILE}.\n` +
      "See .agents/skills/coin-families-contract/SKILL.md\n\n" +
      problems.join("\n"),
  );
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
