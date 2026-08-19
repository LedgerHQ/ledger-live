import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import DetoxFlakeReporter, {
  mergeFlakeRecords,
  collapseAttemptsToFinal,
} from "../src/reporters/detox-flake-reporter.ts";
import type { TestRecord } from "../src/schema.ts";

function withEnv(env: Record<string, string>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    saved[k] = process.env[k];
    process.env[k] = env[k];
  }
  try {
    fn();
  } finally {
    for (const k of Object.keys(env)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

test("appends one NDJSON line per onTestResult assertion", () => {
  const dir = mkdtempSync(join(tmpdir(), "tq-detox-"));
  withEnv({ QUARANTINE_FLAKE_DIR: dir, QUARANTINE_REPO_ROOT: "/repo", JEST_WORKER_ID: "1" }, () => {
    const reporter = new DetoxFlakeReporter();
    reporter.onTestResult(undefined, {
      testFilePath: "/repo/e2e/specs/a.spec.ts",
      testResults: [
        { fullName: "a > flaky", status: "failed", failureMessages: ["boom\n at x"] },
        { fullName: "a > stable", status: "passed" },
      ],
    });
  });
  const files = readdirSync(dir).filter(f => f.endsWith(".ndjson"));
  assert.equal(files.length, 1);
  const lines = readFileSync(join(dir, files[0]), "utf8").trim().split("\n");
  assert.equal(lines.length, 2);
  const first = JSON.parse(lines[0]);
  assert.equal(first.file, "e2e/specs/a.spec.ts");
  assert.equal(first.status, "failed");
  assert.equal(first.errorMessage, "boom");
});

test("append-only data survives a simulated forceExit (no onRunComplete)", () => {
  // We never call onRunComplete; the records must already be on disk.
  const dir = mkdtempSync(join(tmpdir(), "tq-detox-"));
  withEnv({ QUARANTINE_FLAKE_DIR: dir, QUARANTINE_REPO_ROOT: "/repo" }, () => {
    new DetoxFlakeReporter().onTestResult(undefined, {
      testFilePath: "/repo/e2e/specs/b.spec.ts",
      testResults: [{ fullName: "b > t", status: "passed" }],
    });
  });
  const records = mergeFlakeRecords(dir);
  assert.equal(records.length, 1);
  assert.equal(records[0].file, "e2e/specs/b.spec.ts");
});

test("per-worker files merge; attempt index from env distinguishes reruns", () => {
  const dir = mkdtempSync(join(tmpdir(), "tq-detox-"));
  // worker 1, attempt 0 -> fail
  withEnv(
    {
      QUARANTINE_FLAKE_DIR: dir,
      QUARANTINE_REPO_ROOT: "/repo",
      JEST_WORKER_ID: "1",
      QUARANTINE_ATTEMPT: "0",
    },
    () => {
      new DetoxFlakeReporter().onTestResult(undefined, {
        testFilePath: "/repo/e2e/specs/c.spec.ts",
        testResults: [{ fullName: "c > t", status: "failed", failureMessages: ["e"] }],
      });
    },
  );
  // worker 2, attempt 1 -> pass (a rerun in a fresh process)
  withEnv(
    {
      QUARANTINE_FLAKE_DIR: dir,
      QUARANTINE_REPO_ROOT: "/repo",
      JEST_WORKER_ID: "2",
      QUARANTINE_ATTEMPT: "1",
    },
    () => {
      new DetoxFlakeReporter().onTestResult(undefined, {
        testFilePath: "/repo/e2e/specs/c.spec.ts",
        testResults: [{ fullName: "c > t", status: "passed" }],
      });
    },
  );
  const files = readdirSync(dir).filter(f => f.endsWith(".ndjson"));
  assert.equal(files.length, 2, "one file per worker/attempt");
  const records = mergeFlakeRecords(dir);
  assert.equal(records.length, 2);
  const attempts = records.map(r => r.attempt).sort();
  assert.deepEqual(attempts, [0, 1]);
});

test("merge tolerates a torn trailing line", () => {
  const dir = mkdtempSync(join(tmpdir(), "tq-detox-"));
  const file = join(dir, "worker-1-attempt-0.ndjson");
  writeFileSync(
    file,
    `${JSON.stringify({ file: "a.spec.ts", title: "t", attempt: 0, status: "passed" })}\n`,
    "utf8",
  );
  // simulate a torn append (partial JSON, no newline)
  appendFileSync(file, '{"file":"a.spec.ts","title":"t2","attempt":0,"sta');
  const records = mergeFlakeRecords(dir);
  assert.equal(records.length, 1, "complete record kept, torn line skipped");
  assert.equal(records[0].title, "t");
});

test("collapseAttemptsToFinal: pass-on-retry is a PASS (not a gate failure)", () => {
  const recs: TestRecord[] = [
    { file: "a.spec.ts", title: "flaky", attempt: 0, status: "failed", unexpected: true },
    { file: "a.spec.ts", title: "flaky", attempt: 1, status: "passed" },
  ];
  const final = collapseAttemptsToFinal(recs);
  assert.equal(final.length, 1);
  assert.equal(final[0].status, "passed", "any passing attempt => ultimately passed");
});

test("collapseAttemptsToFinal: all-attempts-failed is one unexpected failure", () => {
  const recs: TestRecord[] = [
    {
      file: "a.spec.ts",
      title: "broken",
      attempt: 0,
      status: "failed",
      unexpected: true,
      errorMessage: "boom",
    },
    {
      file: "a.spec.ts",
      title: "broken",
      attempt: 1,
      status: "failed",
      unexpected: true,
      errorMessage: "boom",
    },
  ];
  const final = collapseAttemptsToFinal(recs);
  assert.equal(final.length, 1);
  assert.equal(final[0].status, "failed");
  assert.equal(final[0].unexpected, true);
  assert.equal(final[0].errorMessage, "boom", "keeps a failing attempt's message");
});

test("collapseAttemptsToFinal: distinct tests collapse independently", () => {
  const recs: TestRecord[] = [
    { file: "a.spec.ts", title: "x", attempt: 0, status: "failed", unexpected: true },
    { file: "b.spec.ts", title: "y", attempt: 0, status: "passed" },
  ];
  const final = collapseAttemptsToFinal(recs);
  assert.equal(final.length, 2);
  assert.equal(final.find(r => r.title === "x")?.status, "failed");
  assert.equal(final.find(r => r.title === "y")?.status, "passed");
});
