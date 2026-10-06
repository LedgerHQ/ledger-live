// Detox's own reporter (detox/runners/jest/reporter), with its IPC reporter swapped for one that
// keeps tests flagged with $KnownFailure (helpers/knownFailure.ts) out of Detox's retry.
const {
  DetoxIPCReporter,
  DetoxReporterDispatcher,
  DetoxSummaryReporter,
  DetoxVerboseReporter,
} = require("detox/runners/jest/reporters");
const { reportTestResults, session } = require("detox/internals");
const { query } = require("jest-metadata/reporter");
const path = require("node:path");

const KNOWN_FAILURE_KEY = "ledger.knownFailure";

/** @returns {string | undefined} the issue key of the nearest $KnownFailure on the test or its ancestors */
const knownIssueOf = testCaseResult => {
  let entry;
  try {
    entry = query.testCaseResult(testCaseResult);
  } catch {
    return undefined;
  }
  for (const metadata of [entry, ...entry.allAncestors()]) {
    const issue = metadata.get(KNOWN_FAILURE_KEY);
    if (issue) return String(issue);
  }
  return undefined;
};

// An annotation attaches to whatever jest-circus registers next, so a $KnownFailure followed by a
// hook flags the hook and no test. Nothing would say so: the test is just retried as before.
const warnOnFlaggedHooks = testFilePath => {
  let file;
  try {
    file = query.filePath(testFilePath);
  } catch {
    return;
  }
  for (const describeBlock of file.allDescribeBlocks()) {
    for (const hook of describeBlock.hookDefinitions()) {
      const issue = hook.get(KNOWN_FAILURE_KEY);
      if (!issue) continue;
      console.warn(
        `[known-failure] $KnownFailure("${issue}") in ${path.relative(process.cwd(), testFilePath)} ` +
          `landed on a ${hook.hookType} hook, so it flags no test. ` +
          `Move it right before the describe, it or test function call.`,
      );
    }
  }
};

class KnownFailureIPCReporter extends DetoxIPCReporter {
  /** @type {{ fullName: string, issue: string }[]} */
  #knownFailures = [];

  async onRunComplete(_testContexts, aggregatedResult) {
    const lostTests = aggregatedResult.numTotalTestSuites - aggregatedResult.testResults.length;
    // Results of earlier attempts: a retry pass prunes known failures to "skipped", so their
    // failure has to be carried over or the retry would report the file as fixed.
    const previous = new Map(session.testResults.map(r => [r.testFilePath, r]));

    const results = aggregatedResult.testResults.map(r => {
      warnOnFlaggedHooks(r.testFilePath);
      const failed = r.testResults.filter(t => t.status === "failed");
      const unexpected = [];
      const knownByName = new Map(
        (previous.get(r.testFilePath)?.knownFailures ?? []).map(k => [k.fullName, k]),
      );
      for (const t of failed) {
        const issue = knownIssueOf(t);
        if (issue) knownByName.set(t.fullName, { fullName: t.fullName, issue });
        else unexpected.push(t.fullName);
      }
      const knownFailures = [...knownByName.values()];

      return {
        success: !r.failureMessage && knownFailures.length === 0,
        testFilePath: r.testFilePath,
        testExecError: r.testExecError,
        isPermanentFailure:
          lostTests > 0 ||
          this._isPermanentFailure(r) ||
          (knownFailures.length > 0 && unexpected.length === 0 && !r.testExecError),
        failedTestNames: unexpected,
        knownFailures,
      };
    });

    await reportTestResults(results);

    const reported = new Set(results.map(r => r.testFilePath));
    this.#knownFailures = [
      ...[...previous.values()].filter(r => !reported.has(r.testFilePath)),
      ...results,
    ].flatMap(r => r.knownFailures ?? []);

    if (this.#knownFailures.length > 0) {
      console.warn(
        `[known-failure] ${this.#knownFailures.length} known failure(s), not retried:\n` +
          this.#knownFailures.map(k => `  - ${k.fullName} (${k.issue})`).join("\n"),
      );
    }
  }

  // Jest fails the run when a reporter has an error. Without it, a retry pass that only re-ran
  // the other failures would exit green and hide the known failures from the CI status.
  getLastError() {
    if (this.#knownFailures.length === 0) return undefined;
    return new Error(`${this.#knownFailures.length} known failure(s) were not retried`);
  }
}

class DetoxReporterWithKnownFailures extends DetoxReporterDispatcher {
  constructor(globalConfig) {
    super(globalConfig, {
      DetoxVerboseReporter,
      DetoxSummaryReporter,
      DetoxIPCReporter: KnownFailureIPCReporter,
    });
  }
}

module.exports = DetoxReporterWithKnownFailures;
module.exports.KNOWN_FAILURE_KEY = KNOWN_FAILURE_KEY;
module.exports.knownIssueOf = knownIssueOf;
module.exports.warnOnFlaggedHooks = warnOnFlaggedHooks;
