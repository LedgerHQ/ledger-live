import test from "node:test";
import assert from "node:assert/strict";
import { reduceFlakes } from "../src/flake/reduce.ts";
import type { TestRecord } from "../src/schema.ts";

const r = (over: Partial<TestRecord>): TestRecord => ({
  file: "a.ts",
  title: "t",
  attempt: 0,
  status: "passed",
  ...over,
});

test("fail then pass = one flake (inline attempts)", () => {
  const flakes = reduceFlakes([
    r({ attempt: 0, status: "failed", errorMessage: "boom", stack: "s" }),
    r({ attempt: 1, status: "passed" }),
  ]);
  assert.equal(flakes.length, 1);
  assert.equal(flakes[0].retryCount, 1);
  assert.equal(flakes[0].errorMessage, "boom");
});

test("always pass = no flake", () => {
  assert.equal(reduceFlakes([r({ attempt: 0, status: "passed" })]).length, 0);
});

test("always fail = no flake (not a fail->pass transition)", () => {
  const flakes = reduceFlakes([
    r({ attempt: 0, status: "failed" }),
    r({ attempt: 1, status: "failed" }),
  ]);
  assert.equal(flakes.length, 0);
});

test("flake detected across appended (Detox) records out of order", () => {
  const flakes = reduceFlakes([
    r({ file: "e.spec.ts", title: "x", attempt: 1, status: "passed" }),
    r({ file: "e.spec.ts", title: "x", attempt: 0, status: "failed", errorMessage: "e" }),
  ]);
  assert.equal(flakes.length, 1);
  assert.equal(flakes[0].file, "e.spec.ts");
  assert.equal(flakes[0].retryCount, 1);
});

test("two distinct tests produce two independent groups", () => {
  const flakes = reduceFlakes([
    r({ title: "a", attempt: 0, status: "failed" }),
    r({ title: "a", attempt: 1, status: "passed" }),
    r({ title: "b", attempt: 0, status: "passed" }),
  ]);
  assert.equal(flakes.length, 1);
  assert.equal(flakes[0].title, "a");
});

// blocker 3: the (file,title) grouping key must be collision-safe so a
// space/ambiguous boundary can't merge two genuinely different tests.
test("grouping key does not collide across ambiguous file/title boundaries", () => {
  // ("a b", "c") vs ("a", "b c") would collide under a single-space separator.
  const flakes = reduceFlakes([
    r({ file: "a b", title: "c", attempt: 0, status: "failed", errorMessage: "e1" }),
    r({ file: "a", title: "b c", attempt: 1, status: "passed" }),
  ]);
  // These are two SEPARATE groups: a fail with no later pass, and a lone pass.
  // If they collided into one group it would look like a fail->pass flake.
  assert.equal(flakes.length, 0, "ambiguous keys must not merge into a false flake");
});
