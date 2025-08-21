import { PERFORMANCE_TREND_TYPE } from "../constants";

/** Interface for performance statistics */
export interface PerformanceStats {
  /** Number of runs */
  count: number;
  /** Minimum duration */
  min: number;
  /** Maximum duration */
  max: number;
  /** Mean duration */
  mean: number;
  /** Median duration */
  median: number;
  /** 75th percentile duration */
  p75: number;
  /** 95th percentile duration */
  p95: number;
  /** 99th percentile duration */
  p99: number;
  /** Standard deviation */
  stdDev: number;
}

/** Interface for performance delta accuracy metrics */
export interface PerformanceDeltaAccuracy {
  /** Coefficient of variation for mean across runs */
  meanVariation: number;
  /** Coefficient of variation for median across runs */
  medianVariation: number;
  /** Coefficient of variation for p75 across runs */
  p75Variation: number;
  /** Coefficient of variation for p95 across runs */
  p95Variation: number;
  /** Maximum absolute delta between any two runs */
  maxDelta: number;
  /** Minimum absolute delta between any two runs */
  minDelta: number;
  /** Overall relevance score (0-100) */
  relevanceScore: number;
  /** Whether the variation is statistically significant */
  isSignificant: boolean;
}

export interface PerformanceStatsExtended extends PerformanceStats {
  deltaAccuracy: PerformanceDeltaAccuracy;
}

/** Interface for performance report */
export interface PerformanceReport {
  /** Datadog synthetics test ID */
  testId: string;
  /** Current performance statistics */
  current: PerformanceStatsExtended;
  /** Individual runs */
  individualRuns: PerformanceIndividualRuns;
  /** Variability analysis */
  variabilityAnalysis: PerformanceVariabilityAnalysis;
}

/** Interface for performance individual runs */
export interface PerformanceIndividualRuns {
  /** Total number of runs */
  totalRuns: number;
  /** Durations of individual runs */
  runDurations: number[];
}

/** Interface for performance variability analysis */
export interface PerformanceVariabilityAnalysis {
  /** Whether the variation is statistically significant */
  isVariationSignificant: boolean;
  /** Overall relevance score (0-100) */
  relevanceScore: number;
  /** Coefficient of variation */
  coefficientOfVariation: number;
  /** Maximum absolute delta between any two runs */
  maxDeltaBetweenRuns: number;
  /** Human-readable recommendation message */
  recommendation: string;
}

/** Interface for performance comparison metrics */
export interface PerformanceComparison {
  /** Metric name */
  metric: string;
  /** Current value */
  current: number;
  /** Baseline value */
  baseline: number;
  /** Absolute difference (current - baseline) */
  difference: number;
  /** Percentage change */
  percentageChange: number;
  /** Trend direction */
  trend: PerformanceTrend;
  /** Whether the change is statistically significant */
  isSignificant: boolean;
}

/** Interface for performance trend analysis */
export interface PerformanceTrendAnalysis {
  /** Overall trend assessment */
  overallTrend: PerformanceTrend;
  /** List of individual metric comparisons */
  comparisons: PerformanceComparison[];
  /** Summary of key improvements */
  improvements: string[];
  /** Summary of key degradations */
  degradations: string[];
  /** Confidence score (0-100) */
  confidenceScore: number;
  /** Recommendation */
  recommendation: string;
}

/** Type for performance trend */
export type PerformanceTrend = (typeof PERFORMANCE_TREND_TYPE)[keyof typeof PERFORMANCE_TREND_TYPE];

/** Interface for performance metric */
export interface PerformanceMetric {
  /** Metric name */
  name: string;
  /** Current value */
  current: number;
  /** Baseline value */
  baseline: number;
}
