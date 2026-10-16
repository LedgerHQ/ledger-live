#!/usr/bin/env node
// Run every workspace package's `lint` script and record the config oxlint resolves and each
// diagnostic it produces.
//
// A diagnostic can only change where code violates a rule, so the diff also compares the printed
// configs rule by rule and lists every rule a package loses or downgrades (error to warn, warn to
// off): a weaker rule set passes the same code today and lets the next violation through.
//
// Each package's `lint` script is replayed as `oxlint <args> -f json` in the package directory, so
// the config oxlint finds is the one CI and the editor find. `oxlint --print-config` with the same
// arguments records the resolved plugins, rules and settings (it leaves out `overrides`, which the
// diagnostics still cover). With --all, packages that have a `src/` but no lint script are linted
// too, as `oxlint src`: that is what the editor shows for them.
//
//   lint-snapshot.mjs snap out.json [--all]      run from the repository root
//   lint-snapshot.mjs diff before.json after.json

import fs from "node:fs";
import path from "node:path";
import {
  CPUS,
  ROOT,
  cli,
  clip,
  gitFiles,
  mapPool,
  multisetMinus,
  node,
  readSnapshot,
  relativize,
  same,
  splitArgs,
  unionKeys,
  writeSnapshot,
} from "./shared.mjs";

/**
 * @typedef {object} LintResult
 * @property {string} script the `lint` script replayed, or {@link NO_SCRIPT}
 * @property {number | string} exit
 * @property {number} files files linted
 * @property {number} rules rules enabled, `overrides` included
 * @property {Record<string, unknown>} config `--print-config` output: plugins, rules, settings
 * @property {string[]} diagnostics `severity rule file:line`, sorted
 */

/** @typedef {LintResult | { script: string, error: string }} LintEntry */

const OXLINT = path.join(ROOT, "node_modules/oxlint/bin/oxlint");

// Recorded as the script of a package linted only because of --all, so the diff can tell what CI
// runs from what only the editor shows.
const NO_SCRIPT = "(none) oxlint src";

/** @returns {string[]} every package.json but the root one */
export function manifests() {
  return gitFiles("*package.json").filter(file => file !== "package.json");
}

/**
 * The oxlint arguments of a `lint` script, minus the flags that would change what a run reports
 * (`--fix` rewrites files, `--quiet` hides warnings).
 *
 * @param {string} script
 * @returns {string[] | null} null when the script does not start with an oxlint call
 */
function lintArgs(script) {
  const args = splitArgs(script.split("&&")[0]);
  const index = args.indexOf("oxlint");
  return index === -1 ? null : args.slice(index + 1).filter(a => a !== "--fix" && a !== "--quiet");
}

/**
 * One comparable line per diagnostic. The message is left out: it can embed values that change
 * without the finding changing.
 *
 * @param {any} diagnostic an entry of oxlint's JSON report
 * @returns {string}
 */
function diagnosticLine(diagnostic) {
  const line = diagnostic.labels?.[0]?.span?.line ?? "?";
  return `${diagnostic.severity} ${diagnostic.code} ${diagnostic.filename}:${line}`;
}

/**
 * @param {string} manifest repo-relative package.json path
 * @param {boolean} allPackages also lint packages without a `lint` script
 * @returns {Promise<LintEntry | null>} null when the package is not linted
 */
async function lint(manifest, allPackages) {
  const directory = path.dirname(manifest);
  let script;
  try {
    script = JSON.parse(fs.readFileSync(manifest, "utf8")).scripts?.lint;
  } catch {
    return null;
  }
  let args = script ? lintArgs(script) : null;
  if (!args) {
    if (
      !allPackages ||
      !fs.statSync(path.join(directory, "src"), { throwIfNoEntry: false })?.isDirectory()
    ) {
      return null;
    }
    [script, args] = [NO_SCRIPT, ["src"]];
  }

  const cwd = path.join(ROOT, directory);
  const [run, printed] = await Promise.all([
    node([OXLINT, ...args, "-f", "json"], { cwd }),
    node([OXLINT, ...args, "--print-config"], { cwd }),
  ]);
  let report;
  let config;
  try {
    report = JSON.parse(run.stdout);
    config = relativize(JSON.parse(printed.stdout));
  } catch {
    // oxlint's report carries its own run time, which would make every failure look new.
    const message = (run.stderr || run.stdout || printed.stderr).replace(
      /"start_time":\s*[\d.e-]+/g,
      "",
    );
    return { script, error: clip(message, 300) };
  }
  return {
    script,
    exit: run.exit,
    files: report.number_of_files,
    rules: report.number_of_rules,
    config,
    diagnostics: (report.diagnostics ?? []).map(diagnosticLine).sort(),
  };
}

/**
 * @param {string} outPath receives `{ [packageDir]: LintEntry }`
 * @param {...string} flags `--all` to include packages without a `lint` script
 */
export async function snap(outPath, ...flags) {
  const allPackages = flags.includes("--all");
  const list = manifests();
  const linted = await mapPool(list, Math.max(2, CPUS / 2), manifest =>
    lint(manifest, allPackages),
  );
  const results = {};
  list.forEach((manifest, index) => {
    if (linted[index]) results[path.dirname(manifest)] = linted[index];
  });
  writeSnapshot(outPath, results);
  const keys = Object.keys(results);
  const failed = keys.filter(key => "error" in results[key]);
  const nonzero = keys.filter(key => results[key].exit);
  console.log(
    `${keys.length} packages, ${nonzero.length} non-zero exit, ${failed.length} failed to run`,
  );
  for (const key of failed.slice(0, 10)) console.log("  FAIL", key, clip(results[key].error, 200));
}

/**
 * @param {Record<string, unknown>} [before] `rules` of a printed config
 * @param {Record<string, unknown>} [after]
 * @returns {string[]} one report line per rule whose setting changed
 */
function ruleChanges(before = {}, after = {}) {
  return unionKeys(before, after)
    .filter(rule => !same(before[rule], after[rule]))
    .map(rule => `rule ${rule}: ${JSON.stringify(before[rule])} -> ${JSON.stringify(after[rule])}`);
}

const SEVERITY_RANK = { allow: 0, off: 0, warn: 1, deny: 2, error: 2 };

// oxlint's rule flags on the command line. `--print-config` does not apply them.
const RULE_FLAG = /(?:^|\s)(?:-A|-W|-D|--allow|--warn|--deny)(?:=|\s+)\S+/g;

/**
 * @param {unknown} setting a rule's entry in a printed config: a severity, or [severity, ...options]
 * @returns {string} the severity, `allow` when the rule is not enabled
 */
function severityOf(setting) {
  return (Array.isArray(setting) ? setting[0] : setting) ?? "allow";
}

/**
 * @param {Record<string, unknown>} [before] `rules` of a printed config
 * @param {Record<string, unknown>} [after]
 * @returns {string[]} `rule from -> to`, one per rule the package loses or downgrades
 */
export function weakenedRules(before = {}, after = {}) {
  return Object.keys(before)
    .filter(
      rule => SEVERITY_RANK[severityOf(after[rule])] < SEVERITY_RANK[severityOf(before[rule])],
    )
    .map(rule => `${rule} ${severityOf(before[rule])} -> ${severityOf(after[rule])}`);
}

/**
 * Prints, per package, the script, exit, config and rule changes, then the diagnostics gained (+)
 * and lost (-) per rule, with every new error spelled out. Totals split `ci` (packages with a
 * `lint` script) from `editor` (linted only because of --all). A last section lists the rules each
 * package loses or downgrades.
 *
 * @param {string} beforePath base snapshot
 * @param {string} afterPath branch snapshot
 */
export function diff(beforePath, afterPath) {
  const before = readSnapshot(beforePath);
  const after = readSnapshot(afterPath);
  const totals = {};
  const weakened = [];
  const flagged = [];
  for (const key of unionKeys(before, after)) {
    const b = before[key];
    const a = after[key];
    if (!b || !a) {
      console.log(b ? `- ${key}  no longer linted` : `+ ${key}  newly linted`);
      continue;
    }
    if ("error" in b || "error" in a) {
      if (b.error !== a.error)
        console.log(`! ${key}  before: ${clip(b.error, 80)}  after: ${clip(a.error, 80)}`);
      continue;
    }

    const changes = [];
    if (b.script !== a.script)
      changes.push(`script ${JSON.stringify(b.script)} -> ${JSON.stringify(a.script)}`);
    if (b.exit !== a.exit) changes.push(`exit ${b.exit} -> ${a.exit}`);
    if (b.rules !== a.rules) changes.push(`rules ${b.rules} -> ${a.rules}`);
    changes.push(...ruleChanges(b.config.rules, a.config.rules));
    for (const field of unionKeys(b.config, a.config)) {
      if (field !== "rules" && !same(b.config[field], a.config[field])) {
        changes.push(
          `config ${field}: ${clip(JSON.stringify(b.config[field]), 100)} -> ${clip(JSON.stringify(a.config[field]), 100)}`,
        );
      }
    }

    const gone = multisetMinus(b.diagnostics, a.diagnostics);
    const added = multisetMinus(a.diagnostics, b.diagnostics);
    const byRule = {};
    const ruleOf = item => item.split(" ").slice(0, 2).join(" ");
    for (const item of gone) (byRule[ruleOf(item)] ??= { "-": 0, "+": 0 })["-"] += 1;
    for (const item of added) (byRule[ruleOf(item)] ??= { "-": 0, "+": 0 })["+"] += 1;
    const bucket = a.script === NO_SCRIPT ? "editor" : "ci";
    for (const rule of Object.keys(byRule).sort()) {
      changes.push(`${rule}: -${byRule[rule]["-"]} +${byRule[rule]["+"]}`);
      const severity = rule.split(" ")[0];
      for (const direction of ["-", "+"]) {
        const total = `${bucket} ${severity} ${direction}`;
        totals[total] = (totals[total] ?? 0) + byRule[rule][direction];
      }
    }
    for (const item of added) if (item.startsWith("error")) changes.push(`   NEW ERROR ${item}`);

    const lost = weakenedRules(b.config.rules, a.config.rules);
    if (lost.length > 0) weakened.push({ key, bucket, lost });
    const flags = [b.script, a.script].flatMap(script => script.match(RULE_FLAG) ?? []);
    if (flags.length > 0) flagged.push(`${key}:${[...new Set(flags)].join("")}`);

    if (changes.length > 0) console.log(`~ ${key}\n    ${changes.join("\n    ")}`);
  }
  console.log("\nTOTALS (bucket severity direction):");
  for (const total of Object.keys(totals).sort()) console.log(`   ${total}  ${totals[total]}`);

  console.log("\nWEAKENED RULES (package: rule before -> after):");
  for (const { key, bucket, lost } of weakened) {
    console.log(`  ${bucket} ${key}`);
    for (const rule of lost) console.log(`      ${rule}`);
  }
  const count = bucket =>
    weakened
      .filter(entry => entry.bucket === bucket)
      .reduce((sum, entry) => sum + entry.lost.length, 0);
  const packages = bucket => weakened.filter(entry => entry.bucket === bucket).length;
  console.log(`   ci      ${count("ci")} rule(s) in ${packages("ci")} package(s)`);
  console.log(`   editor  ${count("editor")} rule(s) in ${packages("editor")} package(s)`);
  console.log(
    "   --print-config ignores `overrides` and the rule flags of the command line (-A, -W, -D):\n" +
      "   a rule an override or a flag keeps can show here as weakened, and one they weaken does\n" +
      "   not show. Check those with a probe file in the package.",
  );
  if (flagged.length > 0)
    console.log(`   Packages with rule flags:${flagged.map(f => `\n      ${f}`).join("")}`);
}

await cli(import.meta.url, { snap, diff });
