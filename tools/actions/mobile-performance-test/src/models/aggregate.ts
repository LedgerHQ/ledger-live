import type { PerformanceReport, PerformanceTrendAnalysis } from "./performance";
import type { BaselineMetadata } from "./github";

/** Interface for baseline performance report with metadata */
export interface BaselinePerformanceReport {
  /** Performance report data */
  report: PerformanceReport;
  /** Baseline metadata */
  metadata: BaselineMetadata;
}

/** Interface for complete performance comparison report */
export interface PerformanceComparisonReport {
  /** Current performance report */
  current: PerformanceReport;
  /** Baseline performance report */
  baseline: PerformanceReport;
  /** Baseline metadata */
  baselineMetadata: BaselineMetadata;
  /** Trend analysis */
  trendAnalysis: PerformanceTrendAnalysis;
  /** Comparison timestamp */
  comparisonTimestamp: string;
}
