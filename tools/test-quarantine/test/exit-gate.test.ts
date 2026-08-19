import test from "node:test";
import assert from "node:assert/strict";
import { applyExitGate } from "../src/output/exit-gate.ts";
import type { LoadedEntry, TestRecord } from "../src/schema.ts";

function ignoreEntry(file: string, title?: string): LoadedEntry {
  return {
    entry: {
      mode: "ignore",
      reason: "r",
      owner: "o",
      expiry: "2999-01-01",
      filter: { file, title },
    },
    sourcePath: "/tmp/x.yaml",
    sourceRelative: "quarantine/x.yaml",
  };
}

const rec = (over: Partial<TestRecord>): TestRecord => ({
  file: "a.ts",
  title: "t",
  attempt: 0,
  status: "failed",
  unexpected: true,
  ...over,
});

test("all failures quarantined-ignore -> force exit 0", () => {
  const res = applyExitGate({
    runnerExitCode: 1,
    records: [rec({ file: "a.ts", title: "flaky" })],
    entries: [ignoreEntry("a.ts", "flaky")],
  });
  assert.equal(res.exitCode, 0);
  assert.equal(res.overridden, true);
  assert.equal(res.unhandled.length, 0);
});

test("co-located UNQUARANTINED failure still fails the job", () => {
  const res = applyExitGate({
    runnerExitCode: 1,
    records: [rec({ file: "a.ts", title: "flaky" }), rec({ file: "a.ts", title: "real bug" })],
    entries: [ignoreEntry("a.ts", "flaky")],
  });
  assert.equal(res.exitCode, 1);
  assert.equal(res.overridden, false);
  assert.equal(res.unhandled.length, 1);
  assert.equal(res.unhandled[0].title, "real bug");
});

test("timeout failure is gated the same as a thrown assertion (failure-type-agnostic)", () => {
  // The parser already normalized a timeout into status:failed; the gate only
  // sees status, so a timeout is absorbed exactly like any other failure.
  const res = applyExitGate({
    runnerExitCode: 1,
    records: [
      rec({ file: "a.ts", title: "times out", errorMessage: "Exceeded timeout of 5000 ms" }),
    ],
    entries: [ignoreEntry("a.ts", "times out")],
  });
  assert.equal(res.exitCode, 0);
  assert.equal(res.overridden, true);
});

test("unquarantined timeout still fails", () => {
  const res = applyExitGate({
    runnerExitCode: 1,
    records: [rec({ file: "a.ts", title: "times out", errorMessage: "timeout" })],
    entries: [ignoreEntry("a.ts", "other")],
  });
  assert.equal(res.exitCode, 1);
  assert.equal(res.unhandled.length, 1);
});

test("test that failed an attempt but ultimately passed needs no ignore", () => {
  const res = applyExitGate({
    runnerExitCode: 0,
    records: [
      rec({ attempt: 0, status: "failed", title: "t" }),
      rec({ attempt: 1, status: "passed", unexpected: undefined, title: "t" }),
    ],
    entries: [],
  });
  assert.equal(res.exitCode, 0);
  assert.equal(res.overridden, false);
  assert.equal(res.ignored.length, 0);
  assert.equal(res.unhandled.length, 0);
});

test("expected failure (Playwright) does not trigger the gate", () => {
  const res = applyExitGate({
    runnerExitCode: 0,
    records: [rec({ status: "failed", unexpected: false, title: "expected to fail" })],
    entries: [],
  });
  assert.equal(res.exitCode, 0);
  assert.equal(res.unhandled.length, 0);
});

test("zero-exit run is never altered", () => {
  const res = applyExitGate({
    runnerExitCode: 0,
    records: [],
    entries: [ignoreEntry("a.ts", "flaky")],
  });
  assert.equal(res.exitCode, 0);
  assert.equal(res.overridden, false);
});
