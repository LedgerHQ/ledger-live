import type { AnalyticsFeatureFlagMethod } from "../types";

export const getRemoteABTestingAttributes = (
  analyticsFeatureFlagMethod: AnalyticsFeatureFlagMethod | null,
) => {
  if (!analyticsFeatureFlagMethod) return {};

  const transferFlag = analyticsFeatureFlagMethod("llmTransferButtonCopyVariant");
  const llmTransferButtonCopyVariantEnabled = transferFlag?.enabled ?? false;

  return {
    llmTransferButtonCopyVariantEnabled,
    llmTransferButtonCopyVariant: transferFlag?.params?.variantId,
  };
};
