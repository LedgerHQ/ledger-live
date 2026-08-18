import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_KEEP, parseArgs, UsageError } from "../src/args.ts";

test("defaults to writing with DEFAULT_KEEP", () => {
  const options = parseArgs([]);
  assert.equal(options.keep, DEFAULT_KEEP);
  assert.equal(options.dryRun, false);
});

test("parses --keep, --dry-run and --cwd", () => {
  const options = parseArgs(["--keep=5", "--dry-run", "--cwd=/tmp/workspace"]);
  assert.deepEqual(options, { keep: 5, dryRun: true, cwd: "/tmp/workspace" });
});

test("rejects a non-positive or non-numeric --keep", () => {
  for (const arg of ["--keep=0", "--keep=-3", "--keep=abc", "--keep=2.5"]) {
    assert.throws(() => parseArgs([arg]), UsageError, `expected ${arg} to be rejected`);
  }
});

test("rejects unknown arguments rather than ignoring them", () => {
  assert.throws(() => parseArgs(["--keeep=20"]), UsageError);
  assert.throws(() => parseArgs(["prune"]), UsageError);
});

test("--help is surfaced as a UsageError carrying the usage text", () => {
  for (const flag of ["--help", "-h"]) {
    assert.throws(
      () => parseArgs([flag]),
      (error: unknown) => error instanceof UsageError && error.usage.includes("--keep"),
    );
  }
});
