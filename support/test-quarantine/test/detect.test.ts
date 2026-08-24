import assert from "node:assert/strict";
import test from "node:test";
import { canContributeToFlake, detectFlakes } from "../src/core/detect.ts";
import type { TestOutcome } from "../src/core/outcome.ts";

function outcome(partial: Partial<TestOutcome> & Pick<TestOutcome, "status">): TestOutcome {
  return {
    file: "libs/example/src/a.test.ts",
    title: "suite does a thing",
    attempt: 0,
    ...partial,
  };
}

test("a test that passes first time is not a flake", () => {
  assert.deepEqual(detectFlakes([outcome({ status: "passed" })]), []);
});

test("a test that never passes is not a flake", () => {
  const flakes = detectFlakes([
    outcome({ status: "failed", attempt: 0 }),
    outcome({ status: "failed", attempt: 1 }),
  ]);
  assert.deepEqual(flakes, []);
});

test("a test that fails then passes is a flake", () => {
  const flakes = detectFlakes([
    outcome({ status: "failed", attempt: 0, errorMessage: "boom" }),
    outcome({ status: "passed", attempt: 1 }),
  ]);
  assert.deepEqual(flakes, [
    {
      file: "libs/example/src/a.test.ts",
      title: "suite does a thing",
      errorMessage: "boom",
      retryCount: 1,
    },
  ]);
});

test("retryCount is the attempt that finally passed", () => {
  const flakes = detectFlakes([
    outcome({ status: "failed", attempt: 0, errorMessage: "first" }),
    outcome({ status: "failed", attempt: 1, errorMessage: "second" }),
    outcome({ status: "passed", attempt: 2 }),
  ]);
  assert.equal(flakes.length, 1);
  assert.equal(flakes[0].retryCount, 2);
  assert.equal(flakes[0].errorMessage, "second", "reports the last failure before the pass");
});

test("attempts arriving out of order are still ordered by attempt index", () => {
  const flakes = detectFlakes([
    outcome({ status: "passed", attempt: 1 }),
    outcome({ status: "failed", attempt: 0, errorMessage: "boom" }),
  ]);
  assert.equal(flakes.length, 1);
  assert.equal(flakes[0].errorMessage, "boom");
});

test("two same-titled cases, one failing, are not a flake", () => {
  // `test.each` with a static title gives every case the same fullName, and no
  // runner exposes a per-case id. Without the eligibility filter this reads as
  // "failed then passed" and reports a phantom flake on a genuinely red run.
  const flakes = detectFlakes([
    outcome({ status: "failed", attempt: 0, errorMessage: "case one failed" }),
    outcome({ status: "passed", attempt: 0 }),
  ]);
  assert.deepEqual(flakes, []);
});

test("two same-titled cases that both fail are not a flake", () => {
  const flakes = detectFlakes([
    outcome({ status: "failed", attempt: 0, errorMessage: "one" }),
    outcome({ status: "failed", attempt: 0, errorMessage: "two" }),
  ]);
  assert.deepEqual(flakes, []);
});

test("a same-titled case failing does not mask a real retry-driven flake", () => {
  const flakes = detectFlakes([
    outcome({ status: "passed", attempt: 0 }),
    outcome({ status: "failed", attempt: 0, errorMessage: "boom" }),
    outcome({ status: "passed", attempt: 1 }),
  ]);
  assert.equal(flakes.length, 1);
  assert.equal(flakes[0].retryCount, 1);
});

test("a first-attempt pass is never retained as evidence", () => {
  assert.equal(canContributeToFlake({ ...outcome({ status: "passed" }), attempt: 0 }), false);
  assert.equal(canContributeToFlake({ ...outcome({ status: "skipped" }), attempt: 0 }), false);
  assert.equal(canContributeToFlake({ ...outcome({ status: "skipped" }), attempt: 2 }), true);
  assert.equal(canContributeToFlake({ ...outcome({ status: "failed" }), attempt: 0 }), true);
  assert.equal(canContributeToFlake({ ...outcome({ status: "passed" }), attempt: 1 }), true);
});

test("tests are grouped by file and title, not by title alone", () => {
  const flakes = detectFlakes([
    outcome({ file: "a.test.ts", status: "failed", attempt: 0, errorMessage: "boom" }),
    outcome({ file: "b.test.ts", status: "passed", attempt: 1 }),
  ]);
  assert.deepEqual(flakes, [], "a failure in one file is not cured by a pass in another");
});

test("a same-named test in two files is reported separately", () => {
  const flakes = detectFlakes([
    outcome({ file: "a.test.ts", status: "failed", attempt: 0, errorMessage: "a" }),
    outcome({ file: "a.test.ts", status: "passed", attempt: 1 }),
    outcome({ file: "b.test.ts", status: "failed", attempt: 0, errorMessage: "b" }),
    outcome({ file: "b.test.ts", status: "passed", attempt: 1 }),
  ]);
  assert.deepEqual(flakes.map(flake => flake.file).sort(), ["a.test.ts", "b.test.ts"]);
});

test("skipped attempts never make a test a flake", () => {
  const flakes = detectFlakes([
    outcome({ status: "failed", attempt: 0, errorMessage: "boom" }),
    outcome({ status: "skipped", attempt: 1 }),
  ]);
  assert.deepEqual(flakes, []);
});
