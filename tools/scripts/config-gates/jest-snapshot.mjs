#!/usr/bin/env node
// Record the jest config and test files of every package that uses a @support/jest preset, and
// optionally the result of each test file.
//
// A package is in scope when its package.json depends on @support/jest or one of the former
// @support/jest-* presets, so the same command selects the same consumers on a base checkout and on
// a branch. For each one: the config jest resolves (`--showConfig`) and the test files it finds
// (`--listTests`). With --run, the suites also run, one package at a time, with --ci (no snapshot
// writes) and --forceExit (the features-flow web setup leaves a MessageChannel port open, which
// keeps an in-band run alive).
//
//   jest-snapshot.mjs snap out.json [--run] [package-dir...]   run from the repository root
//   jest-snapshot.mjs diff before.json after.json

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CPUS,
  ROOT,
  cli,
  clip,
  gitFiles,
  mapPool,
  node,
  readSnapshot,
  relativize,
  same,
  unionKeys,
  writeSnapshot,
} from "./shared.mjs";

/** @typedef {{ status: string, passed: number, failed: number, message: string }} TestFile */

/**
 * @typedef {object} SuiteRun
 * @property {number | string} exit
 * @property {number} tests
 * @property {number} failed failed tests
 * @property {Record<string, TestFile>} files keyed by path, relative to the consumer
 */

/**
 * @typedef {object} Consumer
 * @property {object[]} configs `--showConfig` project configs
 * @property {object} globalConfig `--showConfig` global config
 * @property {string[]} tests test files `--listTests` finds, relative to the consumer
 * @property {SuiteRun | { exit: number | string, error: string }} [run] with --run only
 */

// The current preset and the three it replaced, so base and branch select the same consumers.
const PRESET = /"@support\/jest(-devtools|-features-flow|-shared)?"\s*:/;
const TIMEOUT_MS = 30 * 60 * 1000;
// Some fixtures are pinned to this time zone; CI=true runs jest as the CI does.
const ENV = { TZ: "America/New_York", CI: "true" };

// Fields that change between two runs of the same config: derived from the checkout's absolute
// path (id, cacheDirectory) or drawn at random (seed).
const UNSTABLE_PROJECT_FIELDS = ["id", "cacheDirectory"];
const UNSTABLE_GLOBAL_FIELDS = ["cacheDirectory", "seed"];

/** @returns {string[]} directories of the packages depending on a jest preset, sorted */
export function consumers() {
  return gitFiles("*package.json")
    .filter(file => !file.startsWith("support/") && PRESET.test(fs.readFileSync(file, "utf8")))
    .map(file => path.dirname(file))
    .sort();
}

/**
 * The consumer's own jest when it links one, else the version pnpm hoists.
 *
 * @param {string} directory
 * @returns {string}
 */
function jestBin(directory) {
  const local = path.join(ROOT, directory, "node_modules/jest/bin/jest.js");
  return fs.existsSync(local)
    ? local
    : path.join(ROOT, "node_modules/.pnpm/node_modules/jest/bin/jest.js");
}

/**
 * @param {string} directory consumer directory, repo-relative
 * @param {string[]} args
 * @param {number} [timeout] milliseconds
 */
async function jest(directory, args, timeout) {
  return node([jestBin(directory), ...args], {
    cwd: path.join(ROOT, directory),
    env: ENV,
    timeout,
  });
}

/**
 * The resolved config and test files, without running anything. `--no-watchman` lets it work
 * where watchman cannot write its state.
 *
 * @param {string} directory
 * @returns {Promise<Consumer | { error: string }>}
 */
async function inspect(directory) {
  const [shown, listed] = await Promise.all([
    jest(directory, ["--showConfig"]),
    jest(directory, ["--listTests", "--no-watchman"]),
  ]);
  let config;
  try {
    config = JSON.parse(shown.stdout);
  } catch {
    return { error: clip(shown.stderr || shown.stdout, 600) };
  }
  for (const project of config.configs)
    for (const field of UNSTABLE_PROJECT_FIELDS) delete project[field];
  for (const field of UNSTABLE_GLOBAL_FIELDS) delete config.globalConfig[field];
  const tests = listed.stdout.split("\n").filter(line => line.startsWith("/"));
  return relativize({
    configs: config.configs,
    globalConfig: config.globalConfig,
    tests: tests.map(file => path.relative(path.join(ROOT, directory), file)).sort(),
  });
}

/**
 * @param {string} directory
 * @returns {Promise<SuiteRun | { exit: number | string, error: string }>}
 */
async function runSuites(directory) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "jest-snapshot-"));
  const outFile = path.join(outDir, "report.json");
  const proc = await jest(
    directory,
    ["--ci", "--forceExit", "--silent", "--json", `--outputFile=${outFile}`],
    TIMEOUT_MS,
  );
  let data;
  try {
    data = JSON.parse(fs.readFileSync(outFile, "utf8"));
  } catch {
    return {
      exit: proc.exit,
      error: clip(proc.stderr.slice(-600) || proc.stdout.slice(-600), 600),
    };
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  const files = {};
  for (const result of data.testResults ?? []) {
    const assertions = result.assertionResults ?? [];
    files[path.relative(path.join(ROOT, directory), result.name)] = {
      status: result.status,
      passed: assertions.filter(a => a.status === "passed").length,
      failed: assertions.filter(a => a.status === "failed").length,
      message: clip(result.message, 300),
    };
  }
  return { exit: proc.exit, tests: data.numTotalTests, failed: data.numFailedTests, files };
}

/**
 * Inspects every consumer in parallel, then with --run runs their suites one at a time (jest
 * already spreads each one over workers). The snapshot is rewritten after each suite, so an
 * interrupted run keeps what it measured.
 *
 * @param {string} outPath receives `{ [consumerDir]: Consumer }`
 * @param {...string} rest `--run`, and consumer directories to limit the snapshot to
 */
export async function snap(outPath, ...rest) {
  const run = rest.includes("--run");
  const only = rest.filter(arg => arg !== "--run");
  const targets = only.length > 0 ? only : consumers();

  const inspected = await mapPool(targets, Math.max(2, CPUS / 2), inspect);
  const results = Object.fromEntries(
    targets.map((directory, index) => [directory, inspected[index]]),
  );
  const failed = targets.filter(directory => "error" in results[directory]);
  console.log(`${targets.length} consumers inspected, ${failed.length} failed`);
  for (const directory of failed)
    console.log("  FAIL", directory, clip(results[directory].error, 160));
  writeSnapshot(outPath, results);

  if (!run) return;
  for (const [index, directory] of targets.entries()) {
    const r = await runSuites(directory);
    results[directory].run = r;
    const summary = r.error ? clip(r.error, 120) : `tests=${r.tests} failed=${r.failed}`;
    console.log(`[${index + 1}/${targets.length}] ${directory}: exit=${r.exit} ${summary}`);
    writeSnapshot(outPath, results);
  }
}

/**
 * @param {Consumer} before
 * @param {Consumer} after
 * @returns {string[]} one line per config field that changed, global or per project
 */
function configChanges(before, after) {
  const changes = [];
  const pairs = [["globalConfig", before.globalConfig, after.globalConfig]];
  const projects = Math.max(before.configs.length, after.configs.length);
  for (let i = 0; i < projects; i++)
    pairs.push([`configs[${i}]`, before.configs[i], after.configs[i]]);
  for (const [label, b, a] of pairs) {
    for (const field of unionKeys(b, a)) {
      if (!same(b?.[field], a?.[field])) {
        changes.push(
          `${label}.${field}: ${clip(JSON.stringify(b?.[field]), 120)} -> ${clip(JSON.stringify(a?.[field]), 120)}`,
        );
      }
    }
  }
  return changes;
}

/**
 * Sorts each test file whose results changed into regressions (more failures, or newly failing)
 * and fixes. A suite failing to run on one side only is a structural difference.
 *
 * @param {string} pkg
 * @param {Consumer["run"]} before
 * @param {Consumer["run"]} after
 * @param {{ regressions: string[], fixes: string[], other: string[] }} report filled in place
 */
function runChanges(pkg, before, after, report) {
  if (!before || !after) return;
  if ("error" in before || "error" in after) {
    if ("error" in before !== "error" in after) {
      report.other.push(`! ${pkg} run error before=${"error" in before} after=${"error" in after}`);
    }
    return;
  }
  for (const name of unionKeys(before.files, after.files)) {
    const fb = before.files[name];
    const fa = after.files[name];
    if (!fb || !fa) continue;
    if (fb.status !== fa.status || fb.failed !== fa.failed || fb.passed !== fa.passed) {
      const line = `${pkg}/${name}: ${fb.status} ${fb.passed}/${fb.failed} -> ${fa.status} ${fa.passed}/${fa.failed}`;
      const worse = fa.failed > fb.failed || (fa.status === "failed" && fb.status === "passed");
      (worse ? report.regressions : report.fixes).push(line);
    }
  }
}

/**
 * Prints config changes, then regressions, improvements and structural differences (consumers or
 * test files added or removed).
 *
 * @param {string} beforePath base snapshot
 * @param {string} afterPath branch snapshot
 */
export function diff(beforePath, afterPath) {
  const before = readSnapshot(beforePath);
  const after = readSnapshot(afterPath);
  const report = { config: [], regressions: [], fixes: [], other: [] };
  for (const pkg of unionKeys(before, after)) {
    const b = before[pkg];
    const a = after[pkg];
    if (!b || !a) {
      report.other.push(`${b ? "-" : "+"} ${pkg}`);
      continue;
    }
    if ("error" in b || "error" in a) {
      if (b.error !== a.error)
        report.other.push(`! ${pkg} before: ${clip(b.error, 80)} after: ${clip(a.error, 80)}`);
      continue;
    }
    const changes = configChanges(b, a);
    if (changes.length > 0) report.config.push(`~ ${pkg}\n      ${changes.join("\n      ")}`);
    const beforeTests = new Set(b.tests);
    const afterTests = new Set(a.tests);
    for (const test of b.tests) if (!afterTests.has(test)) report.other.push(`- ${pkg}/${test}`);
    for (const test of a.tests) if (!beforeTests.has(test)) report.other.push(`+ ${pkg}/${test}`);
    runChanges(pkg, b.run, a.run, report);
  }
  console.log(`${report.config.length} configs differ`);
  for (const line of report.config) console.log("  ", line);
  console.log(`${report.regressions.length} regressions`);
  for (const line of report.regressions) console.log("  REGRESSION", line);
  console.log(`${report.fixes.length} improvements`);
  for (const line of report.fixes) console.log("  better", line);
  console.log(`${report.other.length} structural differences`);
  for (const line of report.other) console.log("  ", line);
}

await cli(import.meta.url, { snap, diff });
