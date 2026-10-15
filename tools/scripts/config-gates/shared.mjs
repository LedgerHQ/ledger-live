// Helpers shared by the config gates.
//
// Every gate runs from the repository root of the checkout under test and loads that checkout's own
// copy of each tool, so the base and the branch are each measured with the versions they install.
// Snapshots are sorted JSON, written so that two snapshots of the same tree are byte-identical.

import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {object} NodeResult
 * @property {number | string} exit exit code, or the signal name when the process was killed
 *   (a timeout reports `SIGTERM`)
 * @property {string} stdout
 * @property {string} stderr
 */

/** Root of the checkout under test: gates are run from there, never from where they live. */
export const ROOT = process.cwd();

export const CPUS = os.availableParallelism();

// Large enough for `git ls-files` on the whole tree and for tsc's file lists. Node's default (1 MB)
// fails on both, and a truncated listing would silently shrink a snapshot.
const MAX_BUFFER = 1 << 30;

/**
 * `require` resolving from the checkout under test, not from this script's location. Running the
 * branch's copy of a gate on the base checkout still loads the base's TypeScript.
 */
export const requireFromRoot = createRequire(path.join(ROOT, "package.json"));

/**
 * @param {...string} args
 * @returns {string} standard output
 * @throws when git exits non-zero
 */
export function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: MAX_BUFFER });
}

/**
 * Files git tracks, minus anything under a `node_modules/` (a few vendored fixtures are tracked).
 *
 * @param {...string} pathspecs extra `git ls-files` arguments: pathspecs, or flags like `--others`
 * @returns {string[]} repo-relative paths
 */
export function gitFiles(...pathspecs) {
  return git("ls-files", "-z", ...pathspecs)
    .split("\0")
    .filter(file => file && !file.includes("node_modules/"));
}

/**
 * Runs a node script. A failing run is a result, never an exception: the gates record failures
 * instead of stopping on them.
 *
 * @param {string[]} args script path followed by its arguments
 * @param {{ cwd?: string, env?: Record<string, string>, timeout?: number }} [options] `env` is
 *   merged over the current environment; `timeout` is in milliseconds
 * @returns {Promise<NodeResult>}
 */
export function node(args, { cwd = ROOT, env, timeout } = {}) {
  const options = {
    cwd,
    env: { ...process.env, ...env },
    timeout,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  };
  return new Promise(resolve => {
    execFile(process.execPath, args, options, (error, stdout, stderr) => {
      const exit = !error
        ? 0
        : typeof error.code === "number"
          ? error.code
          : (error.signal ?? error.code);
      resolve({ exit, stdout: stdout ?? "", stderr: stderr ?? "" });
    });
  });
}

/**
 * Maps `items` through an async `fn` with at most `limit` calls in flight.
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} limit maximum concurrent calls
 * @param {(item: T) => Promise<R>} fn
 * @returns {Promise<R[]>} results in the order of `items`, whatever order the calls finish in
 */
export async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Splits one command of a package.json script into its arguments, the way a shell would for the
 * simple quoting scripts use: whitespace separates, quotes group and are removed.
 *
 * @example splitArgs("oxlint src --ignore-pattern 'setupTests.ts'")
 *   // ["oxlint", "src", "--ignore-pattern", "setupTests.ts"]
 * @param {string} segment one command, already split on `&&`
 * @returns {string[]}
 */
export function splitArgs(segment) {
  return (segment.match(/(?:[^\s'"]+|'[^']*'|"[^"]*")+/g) ?? []).map(arg =>
    arg.replace(/'([^']*)'|"([^"]*)"/g, "$1$2"),
  );
}

/**
 * Rewrites every absolute path under the checkout as repo-relative, anywhere in a JSON value, so
 * snapshots taken in two different checkouts compare equal.
 *
 * @template T
 * @param {T} value any JSON-serialisable value
 * @returns {T}
 */
export function relativize(value) {
  return JSON.parse(JSON.stringify(value).replaceAll(`${ROOT}/`, "").replaceAll(ROOT, "."));
}

/**
 * Deep copy with object keys in sorted order. Arrays keep their order: it can be meaningful (a
 * `moduleSuffixes` list, a jest `projects` list).
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(key => [key, sortKeys(value[key])]),
  );
}

/**
 * Sorted keys make two snapshots of the same tree byte-identical, so a plain text diff works too.
 *
 * @param {string} file
 * @param {unknown} data
 */
export function writeSnapshot(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(sortKeys(data), null, 1)}\n`);
}

/**
 * @param {string} file
 * @returns {any}
 */
export function readSnapshot(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Keys present in either object, sorted.
 *
 * @param {object} [a]
 * @param {object} [b]
 * @returns {string[]}
 */
export function unionKeys(a = {}, b = {}) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
}

/**
 * Items of `a` that `b` does not account for, counting duplicates: `[x, x, y]` minus `[x]` is
 * `[x, y]`. Lint diagnostics repeat (one rule, one file, two lines), so a set difference would
 * miss a diagnostic that only changes in number.
 *
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 * @returns {T[]} in the order of `a`
 */
export function multisetMinus(a, b) {
  const counts = new Map();
  for (const item of b) counts.set(item, (counts.get(item) ?? 0) + 1);
  return a.filter(item => {
    const count = counts.get(item) ?? 0;
    counts.set(item, count - 1);
    return count <= 0;
  });
}

/**
 * Deep equality of JSON values, ignoring object key order.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function same(a, b) {
  return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

/**
 * One line of at most `n` characters.
 *
 * @param {unknown} text
 * @param {number} n
 * @returns {string}
 */
export function clip(text, n) {
  const single = String(text ?? "").replaceAll("\n", " ");
  return single.length > n ? `${single.slice(0, n)}…` : single;
}

/**
 * Entry point of a gate: dispatches `node <gate> <command> ...args` to `commands[command]`. Does
 * nothing when the module is imported rather than run, so gates can import each other.
 *
 * @param {string} url the gate's `import.meta.url`
 * @param {Record<string, (...args: string[]) => unknown>} commands usually `{ snap, diff }`
 * @returns {Promise<void>}
 */
export async function cli(url, commands) {
  if (!process.argv[1] || fs.realpathSync(process.argv[1]) !== fileURLToPath(url)) return;
  const [command, ...args] = process.argv.slice(2);
  if (!commands[command]) {
    console.error(
      `usage: ${path.basename(process.argv[1])} ${Object.keys(commands).join("|")} ...`,
    );
    process.exit(2);
  }
  await commands[command](...args);
}
