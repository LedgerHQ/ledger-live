import type {
  PerformanceDeltaAccuracy,
  PerformanceReport,
  PerformanceStatsExtended,
} from "../models/performance";
import type { Test, TestResultStep } from "../models/datadog";
import { SUB_TEST_NAME, SUB_TEST_TYPE } from "../constants";
import * as calc from "./calculator";

/** Performance reporter for a single synthetics test result */
export class PerformanceReporter {
  /** The test result to generate a report for */
  private readonly testResult: Test;

  /** The ID of the test */
  private readonly testId: string;

  /**
   * Create a new performance test reporter
   *
   * @param testResult
   * The test result to generate a report for
   */
  constructor(testResult: Test) {
    this.testResult = testResult;
    this.testId = testResult.test.public_id;
  }

  /**
   * Generates the performance report
   *
   * @returns
   * The performance report
   */
  generate(): PerformanceReport {
    const durations = getStepsDurations(this.testResult.result.steps);
    const deltaAccuracy = calc.deltaAccuracyFromDurations(durations);
    const report = perfReport(durations, this.testId, deltaAccuracy);
    return report;
  }

  /**
   * Formats the performance report for output
   * Uses a hybrid approach: always shows key metrics, shows secondary metrics only when significant
   *
   * @param report
   * The performance report to format
   *
   * @returns
   * The formatted performance report
   */
  format(report: PerformanceReport): string {
    const lines = [
      `Performance report for test ${this.testId}:`,
      `  - Total runs: ${report.individualRuns.totalRuns}`,
      `  - Mean duration: ${report.current.mean.toFixed(0)}ms`,
      `  - Median duration: ${report.current.median.toFixed(0)}ms`,
      `  - Coefficient of variation: ${report.variabilityAnalysis.coefficientOfVariation.toFixed(0)}%`,
    ];

    // Add secondary metrics only when they're significant
    const median = report.current.median;
    const p75 = report.current.p75;
    const p95 = report.current.p95;
    const p99 = report.current.p99;

    // Show P75 if it differs significantly from median (>10% difference)
    if (Math.abs(p75 - median) / median > 0.1) {
      lines.push(
        `  - 75th percentile duration: ${p75.toFixed(0)}ms (${(((p75 - median) / median) * 100).toFixed(0)}% from median)`,
      );
    }

    // Show P95 if it differs significantly from median (>20% difference)
    if (Math.abs(p95 - median) / median > 0.2) {
      lines.push(
        `  - 95th percentile duration: ${p95.toFixed(0)}ms (${(((p95 - median) / median) * 100).toFixed(0)}% from median)`,
      );
    }

    // Show P99 if it differs significantly from median (>30% difference)
    if (Math.abs(p99 - median) / median > 0.3) {
      lines.push(
        `  - 99th percentile duration: ${p99.toFixed(0)}ms (${(((p99 - median) / median) * 100).toFixed(0)}% from median)`,
      );
    }

    // Add variability analysis only if variation is significant
    if (report.variabilityAnalysis.isVariationSignificant) {
      lines.push(
        "Relevance analysis:",
        `  - Variability analysis: Significant`,
        `  - Relevance score: ${report.variabilityAnalysis.relevanceScore.toFixed(0)}%`,
        `  - Max delta between runs: ${report.variabilityAnalysis.maxDeltaBetweenRuns.toFixed(0)}ms`,
        `  - Recommendation: ${report.variabilityAnalysis.recommendation}`,
      );
    } else {
      lines.push(
        "Relevance analysis:",
        `  - Variability analysis: Not significant`,
        `  - Recommendation: ${report.variabilityAnalysis.recommendation}`,
      );
    }

    return lines.join("\n");
  }
}

/**
 * Get the durations of all restart steps within a test.
 *
 * @param steps
 * The steps to get the durations of.
 *
 * @returns
 * The durations of the steps
 */
function getStepsDurations(steps: TestResultStep[]): number[] {
  const durations = [];
  let duration = 0;
  let subStepId;

  for (const step of steps) {
    if (step.type === SUB_TEST_TYPE && step.description === SUB_TEST_NAME) {
      if (duration !== 0) durations.push(duration);
      subStepId = step.sub_test.id;
      duration = 0;
    } else if (
      step.type !== SUB_TEST_TYPE &&
      subStepId !== undefined &&
      step.sub_step?.parent_test?.id === subStepId
    ) {
      duration += step.duration;
    }
  }

  if (duration !== 0) durations.push(duration);
  return durations;
}

function perfReport(
  durations: number[],
  testId: string,
  deltaAccuracy: PerformanceDeltaAccuracy,
): PerformanceReport {
  const currentStats = calc.stats(durations);
  const extendedStats: PerformanceStatsExtended = {
    ...currentStats,
    deltaAccuracy,
  };

  const report = {
    testId,
    current: extendedStats,
    individualRuns: {
      totalRuns: durations.length,
      runDurations: durations.map(d => Math.round(d)),
    },
    variabilityAnalysis: {
      isVariationSignificant: deltaAccuracy?.isSignificant || false,
      relevanceScore: deltaAccuracy?.relevanceScore || 0,
      coefficientOfVariation: deltaAccuracy?.meanVariation || 0,
      maxDeltaBetweenRuns: deltaAccuracy?.maxDelta || 0,
      recommendation: deltaAccuracy?.isSignificant
        ? `High variation detected across ${durations.length} runs - performance inconsistency may indicate issues`
        : `Low variation across ${durations.length} runs - performance is consistent and stable`,
    },
  };

  return report;
}
