import type { AnalyticsFeatureFlagMethod } from "../types";

export const getRemoteABTestingAttributes = (
  analyticsFeatureFlagMethod: AnalyticsFeatureFlagMethod | null,
) => {
  if (!analyticsFeatureFlagMethod) return {};

  const transferFlag = analyticsFeatureFlagMethod("llmTransferButtonCopyVariant");
  const llmTransferButtonCopyVariantEnabled = transferFlag?.enabled ?? false;

  const deviceIntentSignFlag = analyticsFeatureFlagMethod("llmWalletApiDeviceIntentSign");
  const llmWalletApiDeviceIntentSignEnabled = deviceIntentSignFlag?.enabled ?? false;

  return {
    llmTransferButtonCopyVariantEnabled,
    llmTransferButtonCopyVariant: transferFlag?.params?.variantId,
    llmWalletApiDeviceIntentSignEnabled,
    llmWalletApiDeviceIntentSignVariant: deviceIntentSignFlag?.params?.variantId,
  };
};
