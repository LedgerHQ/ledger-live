import type { AnalyticsFeatureFlagMethod } from "../../analytics/types";

export const getRemoteABTestingAttributes = (
  analyticsFeatureFlagMethod: AnalyticsFeatureFlagMethod | null,
) => {
  if (!analyticsFeatureFlagMethod) return {};

  const transferFlag = analyticsFeatureFlagMethod("transferButtonCopyVariant");

  return {
    ...(transferFlag?.enabled ? { transferButtonCopyVariant: transferFlag.params?.variantId } : {}),
  };
};
