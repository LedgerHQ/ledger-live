import type {
  PerformanceDeltaAccuracy,
  PerformanceReport,
  PerformanceStatsExtended,
} from "../models/performance";
import type { Test, TestResultStep } from "../models/datadog-test-output";
import { SUB_TEST_NAME, SUB_TEST_TYPE } from "../constants";
import * as calc from "./calculator";

export class PerformanceTestReporter {
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

  generate(): PerformanceReport {
    const durations = getStepsDurations(this.testResult.result.steps);
    const deltaAccuracy = calc.deltaAccuracyFromDurations(durations);
    const report = perfReport(durations, this.testId, deltaAccuracy);
    return report;
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
