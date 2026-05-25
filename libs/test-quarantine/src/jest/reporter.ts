import type { AggregatedResult, Reporter, Test, TestContext, TestResult } from "@jest/reporters";
import { getMatcherState } from "../shared/matcherState.js";
import { matchJestAssertion } from "../shared/matchTest.js";
import { buildTitleFromAncestorTitles } from "../shared/testIdentity.js";

type FailedAssertion = {
  status: string;
  ancestorTitles: string[];
  title: string;
};

function isFailedAssertion(result: FailedAssertion): boolean {
  return result.status === "failed";
}

function handleFailedAssertion(
  testFilePath: string,
  assertion: FailedAssertion,
  onNonQuarantineFailure: () => void,
): void {
  const matcherState = getMatcherState();
  const entry = matchJestAssertion(
    matcherState,
    testFilePath,
    assertion.ancestorTitles,
    assertion.title,
  );
  if (entry?.failureMode === "optional") {
    const fullTitle = buildTitleFromAncestorTitles(assertion.ancestorTitles, assertion.title);
    // eslint-disable-next-line no-console
    console.log(`QUARANTINE-FLAKY ${entry.id} — ${fullTitle} (${assertion.status})`);
    return;
  }
  onNonQuarantineFailure();
}

/**
 * Downgrades suite exit status when every failure is an `failureMode: optional` quarantine.
 */
export default class QuarantineReporter implements Reporter {
  private hadFailure = false;

  private hadNonQuarantineFailure = false;

  onTestResult(_test: Test, testResult: TestResult, _aggregatedResult: AggregatedResult): void {
    for (const assertion of testResult.testResults) {
      if (!isFailedAssertion(assertion)) {
        continue;
      }
      this.hadFailure = true;
      handleFailedAssertion(testResult.testFilePath, assertion, () => {
        this.hadNonQuarantineFailure = true;
      });
    }
  }

  onRunComplete(_testContexts: Set<TestContext>, results: AggregatedResult): void {
    if (results.success) {
      return;
    }
    if (!this.hadFailure || this.hadNonQuarantineFailure) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      "[test-quarantine] All failures were optional quarantine entries; treating suite as passed for exit code.",
    );

    results.success = true;
    results.numFailedTests = 0;
    results.numFailedTestSuites = 0;
    results.numRuntimeErrorTestSuites = 0;
  }
}
