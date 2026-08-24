import assert from "node:assert/strict";
import test from "node:test";
import type { Suite, TestCase, TestResult } from "@playwright/test/reporter";
import { detectFlakes } from "../src/core/detect.ts";
import PlaywrightFlakeReporter, {
  fullTitle,
  toOutcomes,
} from "../src/playwright/flake-reporter.ts";

/**
 * Minimal stand-ins for Playwright's reporter objects. Only the fields the
 * adapter reads are modelled; `test/playwright-integration.test.ts` runs the
 * real thing and pins the shapes.
 */
function suite(type: Suite["type"], title: string, parent?: Suite): Suite {
  // `project()` walks up to the project suite, as Playwright's own does.
  const self = { type, title, parent } as Suite;
  (self as { project: () => { name: string } | undefined }).project = () => {
    for (let s: Suite | undefined = self; s; s = s.parent) {
      if (s.type === "project") return { name: s.title };
    }
    return undefined;
  };
  return self;
}

function result(partial: Partial<TestResult> = {}): TestResult {
  return { retry: 0, status: "passed", errors: [], ...partial } as TestResult;
}

function testCase(partial: Partial<TestCase> = {}): TestCase {
  const file = suite("file", "a.spec.ts", suite("project", "mocked_tests", suite("root", "")));
  return {
    title: "does a thing",
    parent: file,
    expectedStatus: "passed",
    location: { file: "/repo/apps/x/tests/specs/a.spec.ts", line: 1, column: 1 },
    results: [result()],
    ...partial,
  } as TestCase;
}

test("the title is the describes plus the test title", () => {
  const outer = suite("describe", "wallet", suite("file", "a.spec.ts"));
  const inner = suite("describe", "balance", outer);
  assert.equal(fullTitle(testCase({ parent: inner })), "wallet balance does a thing");
});

test("the project and file titles are left out of the title", () => {
  // titlePath() would include both; the file is reported separately and the
  // project name is not part of a test's identity.
  assert.equal(fullTitle(testCase()), "does a thing");
});

test("attempts map straight from retry indices", () => {
  const outcomes = toOutcomes(
    testCase({
      results: [
        result({ retry: 0, status: "failed", errors: [{ message: "boom" }] }),
        result({ retry: 1, status: "passed" }),
      ],
    }),
    "/repo",
  );

  assert.deepEqual(
    outcomes.map(outcome => [outcome.attempt, outcome.status]),
    [
      [0, "failed"],
      [1, "passed"],
    ],
  );
  assert.equal(outcomes[0].errorMessage, "boom");
  assert.equal(outcomes[0].file, "apps/x/tests/specs/a.spec.ts");
});

test("a timeout counts as a failure", () => {
  const [outcome] = toOutcomes(testCase({ results: [result({ status: "timedOut" })] }), "/repo");
  assert.equal(outcome.status, "failed");
});

test("an interrupted attempt is not treated as a failure", () => {
  // The run was cut short before this attempt finished; it says nothing about
  // the test, so it must not pair with a later pass to look like a flake.
  const [outcome] = toOutcomes(testCase({ results: [result({ status: "interrupted" })] }), "/repo");
  assert.equal(outcome.status, "skipped");
});

test("a test expected to fail is ignored entirely", () => {
  const outcomes = toOutcomes(
    testCase({
      expectedStatus: "failed",
      results: [
        result({ retry: 0, status: "failed", errors: [{ message: "as designed" }] }),
        result({ retry: 1, status: "passed" }),
      ],
    }),
    "/repo",
  );
  assert.deepEqual(outcomes, [], "test.fail() failures are the point, not a flake");
});

test("a fail-then-pass sequence is detected as one flake", () => {
  const outcomes = toOutcomes(
    testCase({
      results: [
        result({ retry: 0, status: "failed", errors: [{ message: "boom" }] }),
        result({ retry: 1, status: "passed" }),
      ],
    }),
    "/repo",
  );

  const flakes = detectFlakes(outcomes);
  assert.equal(flakes.length, 1);
  assert.equal(flakes[0].retryCount, 1);
  assert.equal(flakes[0].title, "does a thing");
});

test("a test that fails every attempt is not a flake", () => {
  const outcomes = toOutcomes(
    testCase({
      results: [
        result({ retry: 0, status: "failed", errors: [{ message: "boom" }] }),
        result({ retry: 1, status: "failed", errors: [{ message: "boom" }] }),
      ],
    }),
    "/repo",
  );
  assert.deepEqual(detectFlakes(outcomes), []);
});

test("a test that passes first time is not a flake", () => {
  assert.deepEqual(detectFlakes(toOutcomes(testCase(), "/repo")), []);
});

test("several error messages on one attempt are joined", () => {
  const [outcome] = toOutcomes(
    testCase({
      results: [result({ status: "failed", errors: [{ message: "one" }, { message: "two" }] })],
    }),
    "/repo",
  );
  assert.equal(outcome.errorMessage, "one\ntwo");
});

test("a failure with no error message does not become an empty string", () => {
  const [outcome] = toOutcomes(testCase({ results: [result({ status: "failed" })] }), "/repo");
  assert.equal(outcome.errorMessage, undefined);
});

function inProject(name: string, results: TestResult[]): ReturnType<typeof toOutcomes> {
  const project = suite("project", name, suite("root", ""));
  return toOutcomes(testCase({ parent: suite("file", "a.spec.ts", project), results }), "/repo");
}

test("two projects flaking on the same spec are reported separately", () => {
  // Playwright runs the spec once per project, so each can flake independently.
  // Grouping on (file, title) alone merged them and reported only one.
  const flakes = detectFlakes([
    ...inProject("alpha", [
      result({ retry: 0, status: "failed", errors: [{ message: "alpha failed" }] }),
      result({ retry: 1, status: "passed" }),
    ]),
    ...inProject("beta", [
      result({ retry: 0, status: "failed", errors: [{ message: "beta failed" }] }),
      result({ retry: 1, status: "passed" }),
    ]),
  ]);

  assert.equal(flakes.length, 2, "one flake per project");
  assert.deepEqual(
    flakes.map(flake => flake.errorMessage).sort(),
    ["alpha failed", "beta failed"],
    "each carries its own failure, not the other project's",
  );
});

test("the project name is not part of the reported title", () => {
  const [outcome] = inProject("alpha", [result()]);
  assert.equal(outcome.title, "does a thing");
  assert.equal(outcome.variant, "alpha", "it discriminates, it is not reported");
});

test("a failure in one project is not cured by another project passing", () => {
  const flakes = detectFlakes([
    ...inProject("alpha", [
      result({ retry: 0, status: "failed", errors: [{ message: "alpha failed" }] }),
    ]),
    ...inProject("beta", [result({ retry: 0, status: "passed" })]),
  ]);
  assert.deepEqual(flakes, [], "a hard failure is not a flake");
});

const CI_ENV = { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example" };

test("onEnd without onBegin does nothing rather than throwing", async () => {
  // globalSetup throwing means Playwright never calls onBegin, so there is no
  // suite to walk.
  const reporter = new PlaywrightFlakeReporter({
    env: CI_ENV,
    fetchImpl: (() => assert.fail("must not post without a suite")) as unknown as typeof fetch,
  });

  await reporter.onEnd({ status: "failed" } as never);
});

test("an unexpected internal failure never propagates out of onEnd", async () => {
  const reporter = new PlaywrightFlakeReporter({
    env: CI_ENV,
    // Not a Response; this throws past reportFlakes' own try/catch.
    fetchImpl: (async () => null) as unknown as typeof fetch,
  });

  const flaky = testCase({
    results: [
      result({ retry: 0, status: "failed", errors: [{ message: "boom" }] }),
      result({ retry: 1, status: "passed" }),
    ],
  });
  reporter.onBegin({} as never, { allTests: () => [flaky] } as never);

  await reporter.onEnd({ status: "passed" } as never);
});
