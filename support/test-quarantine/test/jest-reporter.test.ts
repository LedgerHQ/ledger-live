import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseResult } from "@jest/test-result";
import FlakeReporter, { toOutcome } from "../src/jest/flake-reporter.ts";

/**
 * Shapes taken from a real jest 30 run: jest-circus calls `onTestCaseResult`
 * once per attempt, with `invocations` as that attempt's 1-based index.
 */
function caseResult(partial: Partial<TestCaseResult> = {}): TestCaseResult {
  return {
    ancestorTitles: ["outer"],
    title: "flaky one",
    fullName: "outer flaky one",
    status: "passed",
    invocations: 1,
    failureMessages: [],
    failureDetails: [],
    numPassingAsserts: 1,
    retryReasons: [],
    ...partial,
  } as TestCaseResult;
}

const jestTest = { path: "/repo/libs/example/a.test.ts", context: {} as never };

test("invocations map onto 0-based attempt indices", () => {
  assert.equal(toOutcome(caseResult({ invocations: 1 }), "a.test.ts").attempt, 0);
  assert.equal(toOutcome(caseResult({ invocations: 2 }), "a.test.ts").attempt, 1);
});

test("a missing invocations count is treated as the first attempt", () => {
  assert.equal(toOutcome(caseResult({ invocations: undefined }), "a.test.ts").attempt, 0);
});

test("a failing attempt carries its own failure messages", () => {
  const outcome = toOutcome(
    caseResult({ status: "failed", invocations: 1, failureMessages: ["boom", "bang"] }),
    "a.test.ts",
  );
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.errorMessage, "boom\nbang");
});

test("a passing attempt carries no error message", () => {
  assert.equal(toOutcome(caseResult(), "a.test.ts").errorMessage, undefined);
});

test("every not-run status collapses to skipped", () => {
  for (const status of ["skipped", "pending", "todo", "disabled"] as const) {
    assert.equal(toOutcome(caseResult({ status }), "a.test.ts").status, "skipped");
  }
});

test("the reporter reports a test that failed then passed", async () => {
  const posted: unknown[] = [];
  const reporter = new FlakeReporter(undefined, {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example" },
    fetchImpl: (async (_url, init) => {
      posted.push(JSON.parse(String(init?.body)));
      return new Response("", { status: 200 });
    }) as typeof fetch,
  });

  reporter.onTestCaseResult(
    jestTest,
    caseResult({ status: "failed", invocations: 1, failureMessages: ["boom"] }),
  );
  reporter.onTestCaseResult(jestTest, caseResult({ status: "passed", invocations: 2 }));
  await reporter.onRunComplete();

  assert.equal(posted.length, 1);
  const { events } = posted[0] as { events: { testTitle: string; retryCount: number }[] };
  assert.equal(events.length, 1);
  assert.equal(events[0].testTitle, "outer flaky one");
  assert.equal(events[0].retryCount, 1);
});

test("the reporter stays silent when nothing flaked", async () => {
  const reporter = new FlakeReporter(undefined, {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example" },
    fetchImpl: (() =>
      assert.fail("must not post when there are no flakes")) as unknown as typeof fetch,
  });

  reporter.onTestCaseResult(jestTest, caseResult());
  await reporter.onRunComplete();
});

test("a test that only ever fails is not reported as a flake", async () => {
  const reporter = new FlakeReporter(undefined, {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example" },
    fetchImpl: (() => assert.fail("must not post for a hard failure")) as unknown as typeof fetch,
  });

  reporter.onTestCaseResult(
    jestTest,
    caseResult({ status: "failed", invocations: 1, failureMessages: ["boom"] }),
  );
  reporter.onTestCaseResult(
    jestTest,
    caseResult({ status: "failed", invocations: 2, failureMessages: ["boom"] }),
  );
  await reporter.onRunComplete();
});

test("test file paths are reported relative to the repo root", async () => {
  const posted: { events: { file: string }[] }[] = [];
  const reporter = new FlakeReporter(undefined, {
    env: {
      CI: "true",
      FLAKE_API_KEY: "key",
      FLAKE_API_HOST: "https://flake.example",
      QUARANTINE_REPO_ROOT: "/repo",
    },
    fetchImpl: (async (_url, init) => {
      posted.push(JSON.parse(String(init?.body)));
      return new Response("", { status: 200 });
    }) as typeof fetch,
  });

  reporter.onTestCaseResult(
    jestTest,
    caseResult({ status: "failed", invocations: 1, failureMessages: ["boom"] }),
  );
  reporter.onTestCaseResult(jestTest, caseResult({ status: "passed", invocations: 2 }));
  await reporter.onRunComplete();

  assert.equal(posted[0].events[0].file, "libs/example/a.test.ts");
});

test("a reporting failure never propagates out of the reporter", async () => {
  const reporter = new FlakeReporter(undefined, {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example" },
    warn: () => {},
    fetchImpl: (async () => {
      throw new Error("ingest is down");
    }) as typeof fetch,
  });

  reporter.onTestCaseResult(
    jestTest,
    caseResult({ status: "failed", invocations: 1, failureMessages: ["boom"] }),
  );
  reporter.onTestCaseResult(jestTest, caseResult({ status: "passed", invocations: 2 }));

  await reporter.onRunComplete();
});

test("an unexpected internal failure never propagates out of onRunComplete", async () => {
  const warnings: string[] = [];
  const reporter = new FlakeReporter(undefined, {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example" },
    warn: message => warnings.push(message),
    // Not a Response. A broken fetch polyfill or mock looks like this, and it
    // throws past reportFlakes' own try/catch, so only the reporter's guard
    // keeps it from failing the run.
    fetchImpl: (async () => null) as unknown as typeof fetch,
  });

  reporter.onTestCaseResult(
    jestTest,
    caseResult({ status: "failed", invocations: 1, failureMessages: ["boom"] }),
  );
  reporter.onTestCaseResult(jestTest, caseResult({ status: "passed", invocations: 2 }));

  await reporter.onRunComplete();
  assert.match(warnings.join("\n"), /flake reporting failed/);
});

test("a malformed test result cannot fail the run", () => {
  const warnings: string[] = [];
  const reporter = new FlakeReporter(undefined, {
    env: { CI: "true" },
    warn: message => warnings.push(message),
  });

  // jest calls onTestCaseResult from an unawaited listener, so a throw here would
  // surface inside the test run itself.
  reporter.onTestCaseResult(jestTest, null as unknown as TestCaseResult);

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /could not record a test result/);
});

test("only one warning is emitted however many results are malformed", () => {
  const warnings: string[] = [];
  const reporter = new FlakeReporter(undefined, {
    env: { CI: "true" },
    warn: message => warnings.push(message),
  });

  for (let index = 0; index < 50; index += 1) {
    reporter.onTestCaseResult(jestTest, null as unknown as TestCaseResult);
  }
  assert.equal(warnings.length, 1, "a systematic fault must not spam the log per test");
});

test("a failing test alongside a same-titled passing one is not reported", async () => {
  // The test.each shape: two cases, one fullName, both on their first attempt.
  const reporter = new FlakeReporter(undefined, {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example" },
    fetchImpl: (() =>
      assert.fail("must not report a hard failure as a flake")) as unknown as typeof fetch,
  });

  reporter.onTestCaseResult(
    jestTest,
    caseResult({ status: "failed", invocations: 1, failureMessages: ["case one"] }),
  );
  reporter.onTestCaseResult(jestTest, caseResult({ status: "passed", invocations: 1 }));
  await reporter.onRunComplete();
});

test("a missing failureMessages array does not throw", () => {
  const outcome = toOutcome(
    caseResult({ status: "failed", failureMessages: undefined as unknown as string[] }),
    "a.test.ts",
  );
  assert.equal(outcome.errorMessage, "");
});
