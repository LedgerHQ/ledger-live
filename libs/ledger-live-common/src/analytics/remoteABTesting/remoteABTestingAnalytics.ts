import type { AnalyticsFeatureFlagMethod } from "../types";

const PTX_EARN_TRANSACTION_SUCCESS_BANNER_ENABLED = "ptxEarnTransactionSuccessBannerEnabled";
const PTX_EARN_TRANSACTION_SUCCESS_BANNER_DISABLED = "ptxEarnTransactionSuccessBannerDisabled";

export const getRemoteABTestingAttributes = (
  analyticsFeatureFlagMethod: AnalyticsFeatureFlagMethod | null,
) => {
  if (!analyticsFeatureFlagMethod) return {};

  const transferFlag = analyticsFeatureFlagMethod("llmTransferButtonCopyVariant");
  const llmTransferButtonCopyVariantEnabled = transferFlag?.enabled ?? false;

  const deviceIntentSignFlag = analyticsFeatureFlagMethod("llmWalletApiDeviceIntentSign");
  const llmWalletApiDeviceIntentSignEnabled = deviceIntentSignFlag?.enabled ?? false;

  const earnBannerFlag = analyticsFeatureFlagMethod("ptxEarnTransactionSuccessBanner");
  const ptxEarnTransactionSuccessBannerEnabled = earnBannerFlag?.enabled ?? false;

  return {
    llmTransferButtonCopyVariantEnabled,
    llmTransferButtonCopyVariant: transferFlag?.params?.variantId,
    llmWalletApiDeviceIntentSignEnabled,
    llmWalletApiDeviceIntentSignVariant: deviceIntentSignFlag?.params?.variantId,
    ptxEarnTransactionSuccessBannerEnabled,
    ptxEarnTransactionSuccessBanner: ptxEarnTransactionSuccessBannerEnabled
      ? PTX_EARN_TRANSACTION_SUCCESS_BANNER_ENABLED
      : PTX_EARN_TRANSACTION_SUCCESS_BANNER_DISABLED,
  };
};
