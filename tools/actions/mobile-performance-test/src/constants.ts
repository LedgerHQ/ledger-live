/** Type of the sub test that contains the individual runs */
export const SUB_TEST_TYPE = "playSubTest";

/** Name of the sub test that contains the individual runs */
export const SUB_TEST_NAME = "llm--restart";

/** Type for performance trend */
export const PERFORMANCE_TREND_TYPE = {
  IMPROVED: "improved",
  DEGRADED: "degraded",
  STABLE: "stable",
} as const;

/** Significance threshold for performance trend analysis: 5% change threshold */
export const SIGNIFICANCE_THRESHOLD = 0.05;

/** Confidence threshold for performance trend analysis: 70% */
export const CONFIDENCE_THRESHOLD = 0.7;

/** Confidence level thresholds for performance trend analysis */
export const CONFIDENCE_LEVEL_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
} as const;

/** Confidence level for performance trend analysis */
export const CONFIDENCE_LEVEL_TYPE = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

/**
 * Weighting factors for confidence score calculation
 * These weights determine how much each factor contributes to the overall confidence score
 * Total weights must sum to 1.0 (100%)
 */
export const CONFIDENCE_SCORE_WEIGHTS = {
  /**
   * Weight for sample size score (30%)
   * Higher sample sizes increase confidence in the measurements
   */
  SAMPLE_SIZE: 0.3,

  /**
   * Weight for variability score (40%)
   * Lower variability (more consistent measurements) increases confidence
   * This gets the highest weight as consistency is most important for reliable results
   */
  VARIABILITY: 0.4,

  /**
   * Weight for trend consistency score (30%)
   * Consistent trends across metrics increase confidence in the overall assessment
   */
  TREND_CONSISTENCY: 0.3,
} as const;
