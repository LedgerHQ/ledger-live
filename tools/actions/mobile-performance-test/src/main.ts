import * as core from "@actions/core";
import { PerformanceTestReporter } from "./controls/reporter";
import type { Test } from "./models/datadog-test-output";
import { synthetics } from "@datadog/datadog-ci";
import { getReporter, resolveConfig } from "./config";

/**
 * This is the main function that runs the Datadog Synthetics Tests.
 * It is used to run the tests and generate a performance report
 */
export default async function run() {
  synthetics.utils.setCiTriggerApp("github_action");

  const config = resolveConfig();
  const reporter = getReporter();
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

    const baseUrl = synthetics.utils.getAppBaseURL(config);
    const batchUrl = synthetics.utils.getBatchUrl(baseUrl, summary.batchId);
    const testResult = results[0] as unknown as Test;
    const performanceTestReporter = new PerformanceTestReporter(testResult);
    const performanceReport = performanceTestReporter.generate();
    const jsonOutput = JSON.stringify(performanceReport);

    core.setOutput("performance-report", jsonOutput);
    core.info(`Performance report generated: ${jsonOutput}`);

    const exitReason = synthetics.utils.getExitReason(config, { results });

    if (exitReason !== "passed") {
      core.setFailed(`Datadog Synthetics tests failed: ${getTextSummary(summary, batchUrl)}`);
    } else {
      core.info(`Datadog Synthetics tests succeeded: ${getTextSummary(summary, batchUrl)}`);
    }
  } catch (error) {
    synthetics.utils.reportExitLogs(reporter, config, { error });

    const exitReason = synthetics.utils.getExitReason(config, { error });
    if (exitReason !== "passed") {
      core.setFailed("Running Datadog Synthetics tests failed.");
    }
  }
}

/**
 * This function is used to get the text summary of the tests.
 *
 * @param summary
 * The summary of the tests.
 *
 * @param batchUrl
 * The batch URL of the tests.
 * @returns The text summary of the tests.
 */
function getTextSummary(summary: synthetics.Summary, batchUrl: string): string {
  return (
    `criticalErrors: ${summary.criticalErrors}, passed: ${summary.passed}, previouslyPassed: ${summary.previouslyPassed}, failedNonBlocking: ${summary.failedNonBlocking}, failed: ${summary.failed}, skipped: ${summary.skipped}, notFound: ${summary.testsNotFound.size}, timedOut: ${summary.timedOut}\n` +
    `Batch URL: ${batchUrl}`
  );
}

if (require.main === module) {
  run();
}
