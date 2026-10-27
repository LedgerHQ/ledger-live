import assert from "node:assert/strict";
import test from "node:test";
import {
  lockDeferralPasses,
  isExclusiveLockDeferralPass,
  runWithDeferralPasses,
  type DeferralPass,
} from "./deferralPasses";

const recordPasses = (deferredByPass: string[][], exitCodes: number[] = []) => {
  const passes: DeferralPass<string>[] = [];
  const runPass = async (pass: DeferralPass<string>) => {
    passes.push(pass);
    return {
      exitCode: exitCodes[pass.number - 1] ?? 0,
      deferred: pass.mayDefer ? (deferredByPass[pass.number - 1] ?? []) : [],
    };
  };
  return { passes, runPass };
};

test("defers for two passes unless told otherwise", () => {
  assert.equal(lockDeferralPasses({}), 2);
  assert.equal(lockDeferralPasses({ E2E_EXCLUSIVE_LOCK_DEFERRAL_PASSES: " " }), 2);
  assert.equal(lockDeferralPasses({ E2E_EXCLUSIVE_LOCK_DEFERRAL_PASSES: "5" }), 5);
  assert.equal(lockDeferralPasses({ E2E_EXCLUSIVE_LOCK_DEFERRAL_PASSES: "0" }), 0);
});

test("refuses a number of deferral passes that is not a whole number", () => {
  for (const configured of ["-1", "1.5", "two"]) {
    assert.throws(
      () => lockDeferralPasses({ E2E_EXCLUSIVE_LOCK_DEFERRAL_PASSES: configured }),
      /E2E_EXCLUSIVE_LOCK_DEFERRAL_PASSES must be a whole number/,
    );
  }
});

test("reads a deferring pass from the environment the runner sets", () => {
  assert.equal(isExclusiveLockDeferralPass({ E2E_EXCLUSIVE_LOCK_DEFER: "1" }), true);
  assert.equal(isExclusiveLockDeferralPass({ E2E_EXCLUSIVE_LOCK_DEFER: "0" }), false);
  assert.equal(isExclusiveLockDeferralPass({}), false);
});

test("runs a single pass when nothing is deferred", async () => {
  const { passes, runPass } = recordPasses([]);

  assert.equal(await runWithDeferralPasses(runPass, 2), 0);
  assert.deepEqual(
    passes.map(({ number, mayDefer, items, env }) => ({ number, mayDefer, items, env })),
    [{ number: 1, mayDefer: true, items: undefined, env: { E2E_EXCLUSIVE_LOCK_DEFER: "1" } }],
  );
});

test("runs again only what the previous pass deferred, until nothing is", async () => {
  const { passes, runPass } = recordPasses([["a", "b"], ["b"]]);

  await runWithDeferralPasses(runPass, 3);

  assert.deepEqual(
    passes.map(({ number, items }) => ({ number, items })),
    [
      { number: 1, items: undefined },
      { number: 2, items: ["a", "b"] },
      { number: 3, items: ["b"] },
    ],
  );
});

test("waits instead of deferring on the pass after the last deferring one", async () => {
  const { passes, runPass } = recordPasses([["a"], ["a"], ["a"]]);

  await runWithDeferralPasses(runPass, 2);

  assert.deepEqual(
    passes.map(({ number, mayDefer, env }) => ({ number, mayDefer, env })),
    [
      { number: 1, mayDefer: true, env: { E2E_EXCLUSIVE_LOCK_DEFER: "1" } },
      { number: 2, mayDefer: true, env: { E2E_EXCLUSIVE_LOCK_DEFER: "1" } },
      { number: 3, mayDefer: false, env: { E2E_EXCLUSIVE_LOCK_DEFER: "0" } },
    ],
  );
});

test("never defers when no deferral pass is allowed", async () => {
  const { passes, runPass } = recordPasses([["a"]]);

  await runWithDeferralPasses(runPass, 0);

  assert.deepEqual(
    passes.map(({ number, mayDefer }) => ({ number, mayDefer })),
    [{ number: 1, mayDefer: false }],
  );
});

test("stops at the waiting pass even if it reports deferred tests", async () => {
  const passes: number[] = [];
  const runPass = async ({ number }: DeferralPass<string>) => {
    passes.push(number);
    if (number > 5) throw new Error("ran past the waiting pass");
    return { exitCode: 0, deferred: ["a"] };
  };

  await runWithDeferralPasses(runPass, 2);

  assert.deepEqual(passes, [1, 2, 3]);
});

test("keeps the first failing exit code of all passes", async () => {
  const { runPass } = recordPasses([["a"]], [1, 2]);

  assert.equal(await runWithDeferralPasses(runPass, 2), 1);
});

test("fails when only a later pass fails", async () => {
  const { runPass } = recordPasses([["a"]], [0, 2]);

  assert.equal(await runWithDeferralPasses(runPass, 2), 2);
});
