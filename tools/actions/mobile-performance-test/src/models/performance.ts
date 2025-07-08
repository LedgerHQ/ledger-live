export interface PerformanceStats {
  count: number;
  mean: number;
  median: number;
  p75: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
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

export interface PerformanceReport {
  testId: string;
  current: PerformanceStatsExtended;
  individualRuns: PerformanceIndividualRuns;
  variabilityAnalysis: PerformanceVariabilityAnalysis;
}

export interface PerformanceIndividualRuns {
  totalRuns: number;
  runDurations: number[];
}

export interface PerformanceVariabilityAnalysis {
  isVariationSignificant: boolean;
  relevanceScore: number;
  coefficientOfVariation: number;
  maxDeltaBetweenRuns: number;
  recommendation: string;
}
