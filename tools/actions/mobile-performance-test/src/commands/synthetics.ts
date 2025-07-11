import * as core from "@actions/core";
import type { Test } from "../models/datadog";
import { synthetics } from "@datadog/datadog-ci";
import { getReporter, resolveSyntheticsConfig } from "../config";

/**
 * This is the main function that runs the Datadog Synthetics Tests
 * and returns the test result.
 *
 * @returns
 * The test result.
 */
export async function executeSyntheticsTests(): Promise<Test> {
  synthetics.utils.setCiTriggerApp("github_action");

  const reporter = getReporter();
  const config = await resolveSyntheticsConfig();
  const startTime = Date.now();

  try {
    const { results, summary } = await synthetics.executeTests(reporter, config);
    const orgSettings = await synthetics.utils.getOrgSettings(reporter, config);

    synthetics.utils.renderResults({
      config,
      orgSettings,
      reporter,
      results,
      startTime,
      summary,
    });

    synthetics.utils.reportExitLogs(reporter, config, { results });

    const exitReason = synthetics.utils.getExitReason(config, { results });
    const baseUrl = synthetics.utils.getAppBaseURL(config);
    const batchUrl = synthetics.utils.getBatchUrl(baseUrl, summary.batchId);

    if (exitReason !== "passed") {
      throw new Error(`Datadog Synthetics tests failed: ${getTextSummary(summary, batchUrl)}`);
    }

    const [testResult] = results;
    if (!isTestResult(testResult)) {
      throw new Error("Test result is not a valid test result");
    }

    core.info(`Datadog Synthetics tests succeeded: ${getTextSummary(summary, batchUrl)}`);
    return testResult;
  } catch (error) {
    synthetics.utils.reportExitLogs(reporter, config, { error });
    throw new Error(`Datadog Synthetics command exited with error:\n${error}`);
  }
}

/**
 * This function is used to check if the result is a valid test result.
 *
 * @param result
 * The result to check.
 *
 * @returns
 * True if the result is a valid test result, false otherwise.
 */
function isTestResult(result: unknown): result is Test {
  return (
    typeof result === "object" &&
    result !== null &&
    "result" in result &&
    "resultId" in result &&
    "test" in result &&
    "passed" in result
  );
}

/**
 * This function is used to get the text summary of the tests.
 *
 * @param summary
 * The summary of the tests.
 *
 * @param batchUrl
 * The batch URL of the tests.
 *
 * @returns
 * The text summary of the tests.
 */
function getTextSummary(summary: synthetics.Summary, batchUrl: string): string {
  return (
    `criticalErrors: ${summary.criticalErrors}, passed: ${summary.passed}, previouslyPassed: ${summary.previouslyPassed}, failedNonBlocking: ${summary.failedNonBlocking}, failed: ${summary.failed}, skipped: ${summary.skipped}, notFound: ${summary.testsNotFound.size}, timedOut: ${summary.timedOut}\n` +
    `Batch URL: ${batchUrl}`
  );
}
