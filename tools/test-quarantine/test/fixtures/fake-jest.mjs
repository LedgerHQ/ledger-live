#!/usr/bin/env node
/**
 * A stand-in for the `jest` binary used by the CLI integration test.
 *
 * It reads the CLI-injected args to prove the wrapper does its job:
 *  - It echoes the args it received to FAKE_JEST_ARGS_FILE so the test can
 *    assert that skip filters (`--testPathIgnorePatterns` / `--testNamePattern`)
 *    and `--json --outputFile` were appended.
 *  - It writes a fixed jest-shaped JSON result to the `--outputFile` path,
 *    chosen by the FAKE_JEST_SCENARIO env var.
 *  - It exits with the code implied by the scenario (non-zero when any test
 *    "failed"), so the exit-gate has something to gate.
 */
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);

if (process.env.FAKE_JEST_ARGS_FILE) {
  writeFileSync(process.env.FAKE_JEST_ARGS_FILE, JSON.stringify(args), "utf8");
}

function outputFile() {
  const flagIdx = args.indexOf("--outputFile");
  if (flagIdx !== -1) return args[flagIdx + 1];
  const eq = args.find(a => a.startsWith("--outputFile="));
  return eq ? eq.split("=")[1] : null;
}

const repoRoot = process.env.FAKE_JEST_REPO_ROOT ?? process.cwd();
const scenario = process.env.FAKE_JEST_SCENARIO ?? "pass";

// Each scenario describes the FINAL jest --json shape.
const scenarios = {
  // one quarantined-ignore failure only -> exit gate should force 0
  ignoreOnly: {
    exit: 1,
    json: {
      testResults: [
        {
          name: `${repoRoot}/a.test.ts`,
          assertionResults: [
            {
              title: "flaky",
              fullName: "flaky",
              status: "failed",
              failureMessages: ["boom\n at x"],
            },
          ],
        },
      ],
    },
  },
  // a quarantined-ignore failure AND a co-located unquarantined timeout failure
  // -> exit gate must NOT override (real failure remains)
  mixed: {
    exit: 1,
    json: {
      testResults: [
        {
          name: `${repoRoot}/a.test.ts`,
          assertionResults: [
            { title: "flaky", fullName: "flaky", status: "failed", failureMessages: ["boom"] },
            {
              title: "real timeout",
              fullName: "real timeout",
              status: "failed",
              failureMessages: ["thrown: Exceeded timeout of 5000 ms for a test"],
            },
          ],
        },
      ],
    },
  },
  // a flake: passed with a retryReason -> one flake event expected
  flake: {
    exit: 0,
    json: {
      testResults: [
        {
          name: `${repoRoot}/e2e.spec.ts`,
          assertionResults: [
            {
              title: "wobbly",
              fullName: "wobbly",
              status: "passed",
              retryReasons: ["Error: transient\n at y"],
            },
          ],
        },
      ],
    },
  },
  pass: {
    exit: 0,
    json: {
      testResults: [
        {
          name: `${repoRoot}/a.test.ts`,
          assertionResults: [{ title: "ok", fullName: "ok", status: "passed" }],
        },
      ],
    },
  },
};

const chosen = scenarios[scenario] ?? scenarios.pass;
const out = outputFile();
if (out) writeFileSync(out, JSON.stringify(chosen.json), "utf8");
process.exit(chosen.exit);
