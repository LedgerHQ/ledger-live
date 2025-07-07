import * as core from "@actions/core";
import { PerformanceReporter } from "../controls/reporter";
import type { Test } from "../models/datadog";
import { PerformanceReport } from "../models/performance";

/**
 * This function is used to generate a performance report from the test result.
 *
 * @param testResult
 * The test result to generate the performance report from.
 *
 * @returns
 * The performance report.
 */
export function executePerformanceReport(testResult: Test): PerformanceReport {
  const performanceTestReporter = new PerformanceReporter(testResult);
  const performanceReport = performanceTestReporter.generate();
  const jsonOutput = JSON.stringify(performanceReport);

  core.setOutput("performance-report", jsonOutput);
  core.info(performanceTestReporter.format(performanceReport));

  return performanceReport;
}
