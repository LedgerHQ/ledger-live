import type { AnalyticsFeatureFlagMethod } from "../types";

export const getNewSendFlowAttribute = (
  analyticsFeatureFlagMethod: AnalyticsFeatureFlagMethod | null,
) => {
  if (!analyticsFeatureFlagMethod) return false;

  const newSendFlowFlag = analyticsFeatureFlagMethod("newSendFlow");
  return newSendFlowFlag?.enabled ?? false;
};
