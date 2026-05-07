import { useMemo } from "react";
import { useFeature } from "../useFeature";
import {
  FEATURE_FLAG_KEYS,
  type Wallet40Params,
  type WalletFeaturesConfig,
  type WalletPlatform,
} from "./types";

/**
 * Hook for wallet4.0 configuration.
 * Works for both desktop (lwdWallet40) and mobile (lwmWallet40).
 *
 * @param platform - The platform to get the feature flag for ("desktop" or "mobile")
 * @returns Configuration object with boolean flags for each feature
 */
export const useWalletFeaturesConfig = (platform: WalletPlatform): WalletFeaturesConfig => {
  const featureFlagKey = FEATURE_FLAG_KEYS[platform];
  const walletFeatureFlag = useFeature(featureFlagKey);

  return useMemo(() => {
    const isEnabled = walletFeatureFlag?.enabled ?? false;
    // `Wallet40Params` is the symmetric contract for both lwdWallet40 and lwmWallet40.
    // The two Zod schemas in @shared/feature-flags happen to declare slightly
    // different field sets, so we narrow against the unified type here.
    const params = walletFeatureFlag?.params as Wallet40Params | undefined;

    return {
      isEnabled,
      shouldDisplayMarketBanner: isEnabled && Boolean(params?.marketBanner),
      shouldDisplayGraphRework: isEnabled && Boolean(params?.graphRework),
      shouldDisplayQuickActionCtas: isEnabled && Boolean(params?.quickActionCtas),
      shouldDisplayQuickActionsCtasVariant: isEnabled && Boolean(params?.quickActionsCtasVariant),
      shouldDisplayNewReceiveDialog: isEnabled && Boolean(params?.newReceiveDialog),
      shouldDisplayWallet40MainNav: isEnabled && Boolean(params?.mainNavigation),
      shouldUseLazyOnboarding: isEnabled && Boolean(params?.lazyOnboarding),
      shouldDisplayBalanceRefreshRework: isEnabled && Boolean(params?.balanceRefreshRework),
      shouldDisplayTour: isEnabled && Boolean(params?.tour),
      shouldDisplayAssetSection: isEnabled && Boolean(params?.assetSection),
      shouldDisplayOnboardingWidget:
        isEnabled && Boolean(params && "onboardingWidget" in params && params.onboardingWidget),
      shouldDisplayBrazePlacement: isEnabled && Boolean(params?.brazePlacement),
      shouldDisplayOperationsList: isEnabled && Boolean(params?.operationsList),
      shouldDisplayAggregatedAssets: isEnabled && Boolean(params?.aggregatedAssets),
      shouldDisplayMyWallet: isEnabled && Boolean(params?.myWallet),
      shouldDisplayFinishOnboardingWidget:
        isEnabled &&
        Boolean(params && "finishOnboardingWidget" in params && params.finishOnboardingWidget),
    };
  }, [walletFeatureFlag]);
};
