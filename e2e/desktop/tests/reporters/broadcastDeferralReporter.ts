import { writeFileSync } from "node:fs";
import path from "node:path";
import type { FullConfig, Reporter, Suite, TestCase } from "@playwright/test/reporter";
import {
  BROADCAST_DEFERRAL_REPORT_ENV,
  BROADCAST_LOCK_DEFERRED_REASON,
} from "tests/utils/broadcastDeferrals";

const isDeferred = (test: TestCase) => {
  const lastResult = test.results.at(-1);
  return (
    lastResult?.status === "skipped" &&
    lastResult.annotations.some(
      ({ type, description }) => type === "skip" && description === BROADCAST_LOCK_DEFERRED_REASON,
    )
  );
};

const testListLine = (rootDir: string, test: TestCase, file: string) => {
  const [, projectName, , ...titles] = test.titlePath();
  const project = projectName ? `[${projectName}] › ` : "";
  return `${project}${[path.relative(rootDir, file).replaceAll("\\", "/"), ...titles].join(" › ")}`;
};

const specFileOf = (test: TestCase) => {
  let suite: Suite | undefined = test.parent;
  while (suite && suite.type !== "file") suite = suite.parent;
  return suite?.location?.file ?? test.location.file;
};

const testIdOf = (rootDir: string, test: TestCase) => testListLine(rootDir, test, specFileOf(test));

/**
 * The `--test-list` lines that select this test. Playwright loads only the files they name, then
 * matches the file that declares the test, a helper rather than the spec for some tests.
 */
const deferredTest = (rootDir: string, test: TestCase) => ({
  id: testIdOf(rootDir, test),
  testListLines: [
    ...new Set([
      testListLine(rootDir, test, test.location.file),
      testListLine(rootDir, test, specFileOf(test)),
    ]),
  ],
});

const countOutcomes = (tests: readonly TestCase[]) => {
  const count = (outcome: ReturnType<TestCase["outcome"]>) =>
    tests.filter(test => test.outcome() === outcome).length;
  return {
    passed: count("expected"),
    failed: count("unexpected"),
    flaky: count("flaky"),
    skipped: count("skipped"),
  };
};

/**
 * Writes, for scripts/playwrightWithDeferrals.mjs, the tests this pass deferred because their
 * broadcast locks were busy, every test it selected, the outcome counts of the others, and the
 * output directory that holds Playwright's .last-run.json.
 */
class BroadcastDeferralReporter implements Reporter {
  private rootDir = "";
  private suite: Suite | undefined;

  onBegin(config: FullConfig, suite: Suite): void {
    this.rootDir = config.rootDir;
    this.suite = suite;
  }

  onEnd(): void {
    const reportFile = process.env[BROADCAST_DEFERRAL_REPORT_ENV];
    if (!reportFile || !this.suite) return;
    const tests = this.suite.allTests();
    const deferred = tests.filter(isDeferred).map(test => deferredTest(this.rootDir, test));
    writeFileSync(
      reportFile,
      JSON.stringify({
        deferred: [...new Map(deferred.map(test => [test.id, test])).values()],
        selected: tests.map(test => testIdOf(this.rootDir, test)),
        counts: countOutcomes(tests.filter(test => !isDeferred(test))),
        outputDir: this.suite.suites[0]?.project()?.outputDir,
      }),
    );
  }

  printsToStdio(): boolean {
    return false;
  }
}

export default BroadcastDeferralReporter;
