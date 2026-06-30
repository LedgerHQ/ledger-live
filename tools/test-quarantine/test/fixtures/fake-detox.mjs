#!/usr/bin/env node
/**
 * A stand-in for the `detox` binary used by the detox CLI integration test.
 *
 * Detox runs jest under the hood, so it behaves like fake-jest EXCEPT:
 *  - It echoes the args it received to FAKE_DETOX_ARGS_FILE so the test can
 *    assert the wrapper dropped whole-file-skipped spec positionals and injected
 *    the value-bearing flags in `--flag=value` form.
 *  - It writes the per-attempt NDJSON the real DetoxFlakeReporter would emit into
 *    QUARANTINE_FLAKE_DIR. This is the source of truth for BOTH the ignore
 *    exit-gate (collapsed to a final outcome per test) and flake detection —
 *    Detox reruns each attempt in a fresh process, so the last jest --outputFile
 *    isn't reliable. It still writes a jest-shaped --outputFile for realism.
 */
import { writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);

if (process.env.FAKE_DETOX_ARGS_FILE) {
  writeFileSync(process.env.FAKE_DETOX_ARGS_FILE, JSON.stringify(args), "utf8");
}

function outputFile() {
  const eq = args.find(a => a.startsWith("--outputFile="));
  if (eq) return eq.slice("--outputFile=".length);
  const i = args.indexOf("--outputFile");
  return i !== -1 ? args[i + 1] : null;
}

const FILE = "e2e/specs/keep.spec.ts";
const fail = (title, msg) => ({
  file: FILE,
  title,
  attempt: 0,
  status: "failed",
  unexpected: true,
  errorMessage: msg,
});
const pass = (title, attempt = 0) => ({ file: FILE, title, attempt, status: "passed" });

const scenarios = {
  // one quarantined-ignore failure only -> exit gate should force 0
  ignoreOnly: { exit: 1, ndjson: [fail("flaky ignored test", "boom")] },
  // a quarantined-ignore failure AND a co-located unquarantined failure
  // -> exit gate must NOT override (real failure remains)
  mixed: { exit: 1, ndjson: [fail("flaky ignored test", "boom"), fail("real failure", "kaboom")] },
  // pass-on-retry: a failed attempt followed by a passing one -> one flake, and
  // (because a later attempt passed) NOT a gate failure.
  flake: {
    exit: 0,
    ndjson: [
      {
        file: FILE,
        title: "wobbly",
        attempt: 0,
        status: "failed",
        unexpected: true,
        errorMessage: "transient",
      },
      pass("wobbly", 1),
    ],
  },
  pass: { exit: 0, ndjson: [pass("ok")] },
};

const chosen = scenarios[process.env.FAKE_DETOX_SCENARIO ?? "pass"] ?? scenarios.pass;

// Realistic (unused-by-gate) jest --outputFile.
const out = outputFile();
if (out) writeFileSync(out, JSON.stringify({ testResults: [] }), "utf8");

// The reporter NDJSON — the gate + flake source.
if (process.env.QUARANTINE_FLAKE_DIR) {
  mkdirSync(process.env.QUARANTINE_FLAKE_DIR, { recursive: true });
  for (const rec of chosen.ndjson) {
    appendFileSync(
      join(process.env.QUARANTINE_FLAKE_DIR, `worker-1-attempt-${rec.attempt}.ndjson`),
      `${JSON.stringify(rec)}\n`,
      "utf8",
    );
  }
}

process.exit(chosen.exit);
