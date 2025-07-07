import * as core from "@actions/core";
import { GitHubClient } from "../controls/github";
import { PerformanceComparisonReporter } from "../controls/comparison";
import { resolveComparisonConfig } from "../config";
import type { PerformanceReport } from "../models/performance";

/**
 * This function is used to compare the performance report with the baseline report.
 *
 * @param performanceReport
 * The performance report to compare with the baseline report.
 */
export async function executeComparison(performanceReport: PerformanceReport): Promise<void> {
  const comparisonConfig = resolveComparisonConfig();
  if (comparisonConfig?.enabled) {
    try {
      core.info("Performance comparison enabled.");
      core.info("Fetching baseline report...");
      const githubClient = new GitHubClient(
        comparisonConfig.githubToken,
        comparisonConfig.baselineRepo,
      );
      const baselineData = await githubClient.getLatestBaselineReport(
        comparisonConfig.baselineWorkflow,
        comparisonConfig.applicationPlatform,
      );

      core.info("Generating comparison report...");
      const comparisonReporter = new PerformanceComparisonReporter();
      const comparisonReport = comparisonReporter.generate(
        performanceReport,
        baselineData.report,
        baselineData.metadata,
      );

      const comparisonJsonOutput = JSON.stringify(comparisonReport);
      core.setOutput("comparison-report", comparisonJsonOutput);
      core.info(comparisonReporter.format(comparisonReport));
    } catch (comparisonError) {
      throw new Error(`Performance comparison failed: ${comparisonError}`);
    }
  }
}
