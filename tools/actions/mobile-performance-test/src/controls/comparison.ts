import type {
  PerformanceReport,
  PerformanceComparison,
  PerformanceTrendAnalysis,
  PerformanceTrend,
  PerformanceMetric,
} from "../models/performance";
import type { PerformanceComparisonReport } from "../models/aggregate";
import type { BaselineMetadata } from "../models/github";
import {
  CONFIDENCE_LEVEL_THRESHOLDS,
  CONFIDENCE_LEVEL_TYPE,
  CONFIDENCE_SCORE_WEIGHTS,
  PERFORMANCE_TREND_TYPE,
  SIGNIFICANCE_THRESHOLD,
} from "../constants";

/** Performance comparison reporter for comparing {@link PerformanceReport} */
export class PerformanceComparisonReporter {
  /**
   * Compares current performance report with baseline and generates trend analysis
   *
   * @param current
   * The current performance report
   *
   * @param baseline
   * The baseline performance report
   *
   * @param baselineMetadata
   * The baseline metadata
   *
   * @returns
   * The performance comparison report
   */
  generate(
    current: PerformanceReport,
    baseline: PerformanceReport,
    baselineMetadata: BaselineMetadata,
  ): PerformanceComparisonReport {
    const trendAnalysis = analyzeTrends(current, baseline);
    const comparisonReport: PerformanceComparisonReport = {
      current,
      baseline,
      baselineMetadata,
      trendAnalysis,
      comparisonTimestamp: new Date().toISOString(),
    };

    return comparisonReport;
  }

  /**
   * Formats the performance comparison report
   *
   * @param report
   * The performance comparison report
   *
   * @returns
   * The formatted performance comparison report
   */
  format(report: PerformanceComparisonReport): string {
    const { trendAnalysis } = report;
    const { overallTrend, confidenceScore, recommendation, comparisons } = trendAnalysis;

    // Separate key metrics from secondary metrics
    const keyMetrics = ["mean", "median"];
    const keyComparisons = comparisons.filter(comp => keyMetrics.includes(comp.metric));
    const secondaryComparisons = comparisons.filter(comp => !keyMetrics.includes(comp.metric));

    // Apply specific thresholds for secondary metrics
    const significantSecondaryComparisons = secondaryComparisons.filter(
      isSignificantSecondaryComparison,
    );

    const lines = [
      "*Performance trend analysis:*",
      `  - Overall trend: ${overallTrend.toUpperCase()}`,
      `  - Confidence score: ${confidenceScore}%`,
    ];

    if (keyComparisons.length > 0) {
      lines.push("");
      lines.push(...formatKeyComparisons(keyComparisons));
    }

    if (significantSecondaryComparisons.length > 0) {
      lines.push("");
      lines.push(...formatSecondaryComparisons(significantSecondaryComparisons));
    }

    lines.push("");
    lines.push("*Recommendation:*");
    lines.push(recommendation);

    return lines.join("\n");
  }
}

/**
 * Analyzes performance trends between current and baseline reports
 *
 * @param current
 * The current performance report
 *
 * @param baseline
 * The baseline performance report
 *
 * @returns
 * The performance trend analysis
 */
function analyzeTrends(
  current: PerformanceReport,
  baseline: PerformanceReport,
): PerformanceTrendAnalysis {
  const comparisons: PerformanceComparison[] = [];
  const metrics = getMetricsToCompare(current, baseline);

  for (const metric of metrics) {
    const comparison = compareMetric(metric.name, metric.current, metric.baseline);
    comparisons.push(comparison);
  }

  const overallTrend = determineOverallTrend(comparisons);
  const improvements = extractImprovements(comparisons);
  const degradations = extractDegradations(comparisons);
  const confidenceScore = calculateConfidenceScore(current, baseline, comparisons);
  const recommendation = formatRecommendation(
    overallTrend,
    improvements,
    degradations,
    confidenceScore,
  );

  return {
    overallTrend,
    comparisons,
    improvements,
    degradations,
    confidenceScore,
    recommendation,
  };
}

/**
 * Gets the metrics to compare between current and baseline reports
 *
 * @param current
 * The current performance report
 *
 * @param baseline
 * The baseline performance report
 *
 * @returns
 * The metrics to compare
 */
function getMetricsToCompare(
  current: PerformanceReport,
  baseline: PerformanceReport,
): PerformanceMetric[] {
  const metrics = [
    { name: "mean", current: current.current.mean, baseline: baseline.current.mean },
    { name: "median", current: current.current.median, baseline: baseline.current.median },
    { name: "p75", current: current.current.p75, baseline: baseline.current.p75 },
    { name: "p95", current: current.current.p95, baseline: baseline.current.p95 },
    { name: "p99", current: current.current.p99, baseline: baseline.current.p99 },
    { name: "min", current: current.current.min, baseline: baseline.current.min },
    { name: "max", current: current.current.max, baseline: baseline.current.max },
  ];
  return metrics;
}

/**
 * Compares a single performance metric
 *
 * @param metricName
 * The name of the metric to compare
 *
 * @param current
 * The current value of the metric
 */
function compareMetric(
  metricName: string,
  current: number,
  baseline: number,
): PerformanceComparison {
  const difference = current - baseline;
  const percentageChange = baseline === 0 ? 0 : (difference / baseline) * 100;
  const trend = determineTrend(difference);
  const isSignificant = Math.abs(percentageChange) >= SIGNIFICANCE_THRESHOLD * 100;

  return {
    metric: metricName,
    current,
    baseline,
    difference,
    percentageChange,
    trend,
    isSignificant,
  };
}

/**
 * Determines the trend of a performance metric
 *
 * @param difference
 * The difference between the current and baseline values
 *
 * @returns
 * The trend of the performance metric
 */
function determineTrend(difference: number): PerformanceTrend {
  if (Math.abs(difference) < SIGNIFICANCE_THRESHOLD * 100) {
    return PERFORMANCE_TREND_TYPE.STABLE;
  } else if (difference < 0) {
    return PERFORMANCE_TREND_TYPE.IMPROVED;
  } else {
    return PERFORMANCE_TREND_TYPE.DEGRADED;
  }
}

/**
 * Determines the overall trend based on individual metric comparisons
 *
 * @param comparisons
 * The comparisons between the current and baseline reports
 *
 * @returns
 * The overall trend of the performance
 */
function determineOverallTrend(comparisons: PerformanceComparison[]): PerformanceTrend {
  const significantComparisons = comparisons.filter(c => c.isSignificant);

  if (significantComparisons.length === 0) {
    return PERFORMANCE_TREND_TYPE.STABLE;
  }

  const improved = significantComparisons.filter(
    c => c.trend === PERFORMANCE_TREND_TYPE.IMPROVED,
  ).length;
  const degraded = significantComparisons.filter(
    c => c.trend === PERFORMANCE_TREND_TYPE.DEGRADED,
  ).length;

  if (improved > degraded) {
    return PERFORMANCE_TREND_TYPE.IMPROVED;
  } else if (degraded > improved) {
    return PERFORMANCE_TREND_TYPE.DEGRADED;
  } else {
    return PERFORMANCE_TREND_TYPE.STABLE;
  }
}

/**
 * Extracts improvements from comparisons
 *
 * @param comparisons
 * The comparisons between the current and baseline reports
 *
 * @returns
 * The improvements in the performance
 */
function extractImprovements(comparisons: PerformanceComparison[]): string[] {
  return comparisons
    .filter(c => c.trend === PERFORMANCE_TREND_TYPE.IMPROVED && c.isSignificant)
    .map(improvementMessage);
}

/**
 * Generates a message for an improvement
 *
 * @param comparison
 * The comparison between the current and baseline reports
 *
 * @returns
 * The message for the improvement
 */
function improvementMessage(comparison: PerformanceComparison): string {
  return `${comparison.metric}: ${Math.abs(comparison.percentageChange).toFixed(1)}% faster (${Math.abs(comparison.difference).toFixed(0)}ms)`;
}

/**
 * Extracts degradations from comparisons
 *
 * @param comparisons
 * The comparisons between the current and baseline reports
 *
 * @returns
 * The degradations in the performance
 */
function extractDegradations(comparisons: PerformanceComparison[]): string[] {
  return comparisons
    .filter(c => c.trend === PERFORMANCE_TREND_TYPE.DEGRADED && c.isSignificant)
    .map(degradationMessage);
}

/**
 * Generates a message for a degradation
 *
 * @param comparison
 * The comparison between the current and baseline reports
 *
 * @returns
 * The message for the degradation
 */
function degradationMessage(comparison: PerformanceComparison): string {
  return `${comparison.metric}: ${Math.abs(comparison.percentageChange).toFixed(1)}% slower (${Math.abs(comparison.difference).toFixed(0)}ms)`;
}

/**
 * Calculates confidence score based on variability and sample size
 *
 * @param current
 * The current performance report
 *
 * @param baseline
 * The baseline performance report
 *
 * @param comparisons
 * The comparisons between the current and baseline reports
 *
 * @returns
 * The confidence score
 */
function calculateConfidenceScore(
  current: PerformanceReport,
  baseline: PerformanceReport,
  comparisons: PerformanceComparison[],
): number {
  // Base confidence on sample sizes and variability
  const currentSampleSize = current.individualRuns.totalRuns;
  const baselineSampleSize = baseline.individualRuns.totalRuns;

  // Higher sample sizes increase confidence
  const sampleSizeScore = Math.min(100, ((currentSampleSize + baselineSampleSize) / 20) * 100);

  // Lower variability increases confidence
  const currentVariability = current.current.deltaAccuracy.meanVariation;
  const baselineVariability = baseline.current.deltaAccuracy.meanVariation;
  const avgVariability = (currentVariability + baselineVariability) / 2;
  const variabilityScore = Math.max(0, 100 - avgVariability * 100);

  // Consistency of trends increases confidence
  const significantComparisons = comparisons.filter(c => c.isSignificant);
  const consistentTrends =
    significantComparisons.length > 0
      ? (significantComparisons.filter(c => c.trend === determineOverallTrend(comparisons)).length /
          significantComparisons.length) *
        100
      : 100;

  // Weighted average of factors
  const confidenceScore =
    sampleSizeScore * CONFIDENCE_SCORE_WEIGHTS.SAMPLE_SIZE +
    variabilityScore * CONFIDENCE_SCORE_WEIGHTS.VARIABILITY +
    consistentTrends * CONFIDENCE_SCORE_WEIGHTS.TREND_CONSISTENCY;
  return Math.round(confidenceScore);
}

/**
 * Formats the key comparisons
 *
 * @param comparisons
 * The comparisons between the current and baseline reports
 *
 * @returns
 * The key comparisons
 */
function formatKeyComparisons(keyComparisons: PerformanceComparison[]): string[] {
  return [
    "*Key metrics:*",
    ...keyComparisons.map(comp => {
      const changeEmoji = formatTrendToEmoji(comp.trend);
      const changeText = formatTrendToText(comp.trend);
      const percentage = Math.abs(comp.percentageChange).toFixed(1);
      const difference = Math.abs(comp.difference).toFixed(0);
      const significance = comp.isSignificant ? " (significant)" : " (stable)";
      return `  - *${changeEmoji} ${comp.metric}:* ${percentage}% ${changeText} (${difference}ms)${significance}`;
    }),
  ];
}

/**
 * Formats the secondary comparisons
 *
 * @param secondaryComparisons
 * The secondary comparisons
 *
 * @returns
 * The secondary comparisons
 */
function formatSecondaryComparisons(secondaryComparisons: PerformanceComparison[]): string[] {
  return [
    "*Secondary metrics (threshold-based):*",
    ...secondaryComparisons.map(comp => {
      const changeEmoji = formatTrendToEmoji(comp.trend);
      const changeText = formatTrendToText(comp.trend);
      const percentage = Math.abs(comp.percentageChange).toFixed(1);
      const difference = Math.abs(comp.difference).toFixed(0);
      return `  - *${changeEmoji} ${comp.metric}:* ${percentage}% ${changeText} (${difference}ms)`;
    }),
  ];
}

/**
 * Formats the trend
 *
 * @param trend
 * The trend
 *
 * @returns
 * The formatted trend
 */
function formatTrendToEmoji(trend: PerformanceTrend): string {
  switch (trend) {
    case PERFORMANCE_TREND_TYPE.IMPROVED:
      return "📈";
    case PERFORMANCE_TREND_TYPE.DEGRADED:
      return "📉";
    default:
      return "➡️";
  }
}

/**
 * Formats the trend to text
 *
 * @param trend
 * The trend
 *
 * @returns
 * The formatted trend
 */
function formatTrendToText(trend: PerformanceTrend): string {
  switch (trend) {
    case PERFORMANCE_TREND_TYPE.IMPROVED:
      return "faster";
    case PERFORMANCE_TREND_TYPE.DEGRADED:
      return "slower";
    default:
      return "stable";
  }
}

/**
 * Checks if a secondary comparison is significant
 *
 * @param comp
 * The comparison
 *
 * @returns
 * True if the comparison is significant, false otherwise
 */
function isSignificantSecondaryComparison(comp: PerformanceComparison): boolean {
  const absPercentage = Math.abs(comp.percentageChange);
  switch (comp.metric) {
    case "p75":
      return absPercentage > 10;
    case "p95":
      return absPercentage > 20;
    case "p99":
      return absPercentage > 30;
    default:
      // For min, max, use original significance
      return comp.isSignificant;
  }
}

/**
 * Generates recommendation based on analysis
 *
 * @param overallTrend
 * The overall trend of the performance
 *
 * @param improvements
 * The improvements in the performance
 *
 * @param degradations
 * The degradations in the performance
 *
 * @param confidenceScore
 * The confidence score of the performance
 *
 * @returns
 * The recommendation message
 */
function formatRecommendation(
  overallTrend: PerformanceTrend,
  improvements: string[],
  degradations: string[],
  confidenceScore: number,
): string {
  const confidenceLevel = formatConfidenceLevel(confidenceScore);
  const recommendation = [
    `  - *Performance trend:* ${overallTrend} (${confidenceLevel} confidence, ${confidenceScore}% score). `,
  ];

  switch (overallTrend) {
    case PERFORMANCE_TREND_TYPE.IMPROVED:
      recommendation.push(
        `  - Great job! Performance has improved across ${improvements.length} metrics. `,
      );
      if (degradations.length > 0) {
        recommendation.push(
          `  - However, monitor the ${degradations.length} degraded metrics for potential regressions. `,
        );
      }
      break;
    case PERFORMANCE_TREND_TYPE.DEGRADED:
      recommendation.push(`  - Performance has degraded across ${degradations.length} metrics.`);
      recommendation.push(
        "  - Investigate the root causes and consider rolling back changes that may have caused this regression.",
      );
      if (improvements.length > 0) {
        recommendation.push(`  - *Note:* ${improvements.length} metrics showed improvement. `);
      }
      break;
    case PERFORMANCE_TREND_TYPE.STABLE:
      recommendation.push("  - Performance is stable with no significant changes detected.");
      break;
  }

  if (confidenceScore < 60) {
    recommendation.push(
      "  - Low confidence score suggests high variability or small sample size - consider running more tests for better accuracy.",
    );
  }

  return recommendation.join("\n");
}

/**
 * Formats the confidence level
 *
 * @param confidenceScore
 * The confidence score
 *
 * @returns
 * The formatted confidence level
 */
function formatConfidenceLevel(confidenceScore: number): string {
  if (confidenceScore >= CONFIDENCE_LEVEL_THRESHOLDS.HIGH) {
    return CONFIDENCE_LEVEL_TYPE.HIGH;
  } else if (confidenceScore >= CONFIDENCE_LEVEL_THRESHOLDS.MEDIUM) {
    return CONFIDENCE_LEVEL_TYPE.MEDIUM;
  } else {
    return CONFIDENCE_LEVEL_TYPE.LOW;
  }
}
