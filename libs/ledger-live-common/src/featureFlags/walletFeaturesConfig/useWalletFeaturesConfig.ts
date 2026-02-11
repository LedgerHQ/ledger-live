import { useMemo } from "react";
import useFeature from "../useFeature";
import { WalletPlatform, WalletFeaturesConfig, FEATURE_FLAG_KEYS } from "./types";

/**
 * Hook for wallet4.0 configuration.
 * Works for both desktop (lwdWallet40) and mobile (lwmWallet40).
 *
 * When adding platform-specific params in types-live:
 * 1. Add the param to Feature_LwdWallet40 or Feature_LwmWallet40
 * 2. Add the corresponding boolean getter in WalletFeaturesConfig
 * 3. Add the logic in the useMemo below
 *
 * @param platform - The platform to get the feature flag for ("desktop" or "mobile")
 * @returns Configuration object with boolean flags for each feature
 *
 * @example
 * // Desktop usage
 * const config = useWalletFeaturesConfig("desktop");
 *
 * @example
 * // Mobile usage
 * const config = useWalletFeaturesConfig("mobile");
 */
export const useWalletFeaturesConfig = (platform: WalletPlatform): WalletFeaturesConfig => {
  const featureFlagKey = FEATURE_FLAG_KEYS[platform];
  const walletFeatureFlag = useFeature(featureFlagKey);

  console.log("params", walletFeatureFlag?.params);
  console.log("enabled", walletFeatureFlag?.enabled);
  console.log("featureFlagKey", featureFlagKey);

  return useMemo(() => {
    const isEnabled = walletFeatureFlag?.enabled ?? false;
    const params = walletFeatureFlag?.params;

    return {
      isEnabled,
      shouldDisplayMarketBanner: isEnabled && Boolean(params?.marketBanner),
      shouldDisplayGraphRework: isEnabled && Boolean(params?.graphRework),
      shouldDisplayQuickActionCtas: isEnabled && Boolean(params?.quickActionCtas),
      shouldDisplayNewReceiveDialog: isEnabled && Boolean(params?.newReceiveDialog),
      shouldDisplayWallet40MainNav: isEnabled && Boolean(params?.mainNavigation),
      shouldUseLazyOnboarding: isEnabled && Boolean(params?.lazyOnboarding),
    };
  }, [walletFeatureFlag]);
};
