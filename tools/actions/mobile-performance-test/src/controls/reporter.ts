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
   *
   * @param report
   * The performance report to format
   *
   * @returns
   * The formatted performance report
   */
  format(report: PerformanceReport): string {
    return [
      `*Performance report for test ${this.testId}:*`,
      `  - *Total runs:* ${report.individualRuns.totalRuns}`,
      `  - *Mean duration:* ${report.current.mean.toFixed(0)}ms`,
      `  - *Median duration:* ${report.current.median.toFixed(0)}ms`,
      `  - *75th percentile duration:* ${report.current.p75.toFixed(0)}ms`,
      `  - *95th percentile duration:* ${report.current.p95.toFixed(0)}ms`,
      `  - *99th percentile duration:* ${report.current.p99.toFixed(0)}ms`,
      "",
      "*Relevance analysis:*",
      `  - *Variability analysis:* ${report.variabilityAnalysis.isVariationSignificant ? "Significant" : "Not significant"}`,
      `  - *Relevance score:* ${report.variabilityAnalysis.relevanceScore.toFixed(0)}%`,
      `  - *Coefficient of variation:* ${report.variabilityAnalysis.coefficientOfVariation.toFixed(0)}%`,
      `  - *Max delta between runs:* ${report.variabilityAnalysis.maxDeltaBetweenRuns.toFixed(0)}ms`,
      `  - *Recommendation:* ${report.variabilityAnalysis.recommendation}`,
    ].join("\n");
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
