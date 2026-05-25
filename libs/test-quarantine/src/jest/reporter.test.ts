import fs from "fs";
import os from "os";
import path from "path";
import YAML from "yaml";
import type { AggregatedResult, Test, TestResult } from "@jest/reporters";
import { resetMatcherStateForTests } from "../shared/matcherState.js";
import QuarantineReporter from "./reporter.js";

function writeQuarantineEntry(repoRoot: string, id: string, body: Record<string, unknown>): void {
  const dir = path.join(repoRoot, "quarantine");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.yml`), YAML.stringify(body));
}

function makeFailedTestResult(
  testFilePath: string,
  ancestorTitles: string[],
  title: string,
): TestResult {
  const assertion = {
    ancestorTitles,
    duration: 1,
    failureDetails: [],
    failureMessages: ["expected true to be false"],
    fullName: [...ancestorTitles, title].join(" "),
    invocations: 1,
    location: null,
    numPassingAsserts: 0,
    retryReasons: [],
    startAt: Date.now(),
    status: "failed",
    title,
  };
  return {
    console: undefined,
    displayName: undefined,
    failureMessage: assertion.failureMessages[0],
    leaks: false,
    numFailingTests: 1,
    numPassingTests: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    openHandles: [],
    perfStats: { end: 1, start: 0, runtime: 1, slow: false },
    skipped: false,
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
      uncheckedKeys: [],
      unmatched: 0,
      updated: 0,
    },
    testFilePath,
    testResults: [assertion],
  };
}

describe("QuarantineReporter", () => {
  let repoRoot: string;
  let originalCwd: string;

  beforeEach(() => {
    resetMatcherStateForTests();
    repoRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "test-quarantine-")));
    originalCwd = process.cwd();
    process.chdir(repoRoot);
    fs.writeFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), "");
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  it("downgrades success when all failures are optional quarantines", () => {
    writeQuarantineEntry(repoRoot, "optional-unit", {
      team: "@ledgerhq/qa",
      expiry: "2099-01-01",
      reason: "flaky",
      failureMode: "optional",
      filter: {
        files: "apps/desktop/src/**/Foo.test.ts",
        title: "renders label",
      },
    });

    const reporter = new QuarantineReporter();
    const testFilePath = path.join(repoRoot, "apps/desktop/src/Foo.test.ts");
    const test = { path: testFilePath } as Test;
    const testResult = makeFailedTestResult(testFilePath, ["Foo"], "renders label");
    const aggregated = { success: false } as AggregatedResult;

    reporter.onTestResult(test, testResult, aggregated);
    reporter.onRunComplete(new Set(), aggregated);

    expect(aggregated.success).toBe(true);
    expect(aggregated.numFailedTests).toBe(0);
  });

  it("keeps failure when a test is not quarantined", () => {
    writeQuarantineEntry(repoRoot, "optional-unit", {
      team: "@ledgerhq/qa",
      expiry: "2099-01-01",
      reason: "flaky",
      failureMode: "optional",
      filter: {
        files: "apps/desktop/src/**/Foo.test.ts",
        title: "renders label",
      },
    });

    const reporter = new QuarantineReporter();
    const test = { path: path.join(repoRoot, "apps/desktop/src/Bar.test.ts") } as Test;
    const testResult = makeFailedTestResult(test.path, ["Bar"], "fails");
    const aggregated = { success: false } as AggregatedResult;

    reporter.onTestResult(test, testResult, aggregated);
    reporter.onRunComplete(new Set(), aggregated);

    expect(aggregated.success).toBe(false);
  });
});
