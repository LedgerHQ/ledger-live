import type { AnalyticsFeatureFlagMethod } from "../types";

export const getRecoverV2Attribute = (
  analyticsFeatureFlagMethod: AnalyticsFeatureFlagMethod | null,
) => {
  if (!analyticsFeatureFlagMethod) return false;

  return analyticsFeatureFlagMethod("recoverV2")?.enabled ?? false;
};
