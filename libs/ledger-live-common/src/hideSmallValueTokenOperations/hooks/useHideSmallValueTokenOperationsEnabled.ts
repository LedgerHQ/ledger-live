import { useFeature } from "../../featureFlags";
import { MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD } from "../smallValueOperationsThreshold";

export type HideSmallValueTokenOperationsConfig = {
  /** Whether the dust filter is active. */
  enabled: boolean;
  /**
   * USD threshold below which incoming token operations are hidden.
   * Sourced from the `lldHideSmallValueTokenOperations` Firebase feature flag;
   * falls back to MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD ($0.5) when the
   * flag has no params.
   */
  thresholdUsd: number;
};

/**
 * Returns the current configuration for the `lldHideSmallValueTokenOperations`
 * feature: whether the filter is active and what USD threshold to apply.
 *
 * The threshold defaults to $0.5 but can be overridden remotely via Firebase.
 */
export function useHideSmallValueTokenOperationsEnabled(): HideSmallValueTokenOperationsConfig {
  const feature = useFeature("lldHideSmallValueTokenOperations");
  return {
    enabled: feature?.enabled ?? false,
    thresholdUsd: feature?.params?.thresholdUsd ?? MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD,
  };
}
