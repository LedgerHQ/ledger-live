import { useMemo } from "react";
import type { Features } from "@shared/feature-flags";
import { useFeature } from "../hooks/useFeature";

/**
 * Hook for wallet4.0 configuration. Works for both desktop (lwdWallet40)
 * and mobile (lwmWallet40).
 *
 * @param platform
 * The platform to get the feature flag for ("desktop" or "mobile")
 *
 * @returns
 * Configuration object with boolean flags for each feature
 */
export function useWalletFeaturesConfig(platform: WalletPlatform): WalletFeaturesConfig {
  const featureFlagKey = FEATURE_FLAG_KEYS[platform];
  const walletFeatureFlag = useFeature(featureFlagKey);

  return useMemo(() => {
    const isEnabled = walletFeatureFlag?.enabled ?? false;
    // `Wallet40Params` is the symmetric contract for both lwdWallet40 and lwmWallet40.
    // The two Zod schemas in @shared/feature-flags happen to declare slightly
    // different field sets, so we narrow against the unified type here.
    const params: Wallet40Params | undefined = walletFeatureFlag?.params;

    return {
      isEnabled,
      shouldDisplayMarketBanner: isEnabled && Boolean(params?.marketBanner),
      shouldDisplayGraphRework: isEnabled && Boolean(params?.graphRework),
      shouldDisplayQuickActionCtas: isEnabled && Boolean(params?.quickActionCtas),
      shouldDisplayNewReceiveDialog: isEnabled && Boolean(params?.newReceiveDialog),
      shouldDisplayWallet40MainNav: isEnabled && Boolean(params?.mainNavigation),
      shouldUseLazyOnboarding: isEnabled && Boolean(params?.lazyOnboarding),
      shouldDisplayBalanceRefreshRework: isEnabled && Boolean(params?.balanceRefreshRework),
      shouldDisplayTour: isEnabled && Boolean(params?.tour),
      shouldDisplayAssetSection: isEnabled && Boolean(params?.assetSection),
      shouldDisplayBrazePlacement: isEnabled && Boolean(params?.brazePlacement),
      shouldDisplayOperationsList: isEnabled && Boolean(params?.operationsList),
      shouldDisplayAggregatedAssets: isEnabled && Boolean(params?.aggregatedAssets),
      shouldDisplayMyWallet: isEnabled && Boolean(params?.myWallet),
      shouldDisplayPnl: isEnabled && Boolean(params?.pnl),
      shouldDisplayAssetDiscoverability: isEnabled && Boolean(params?.assetDiscoverability),
      shouldDisplayEarnUpselling: isEnabled && Boolean(params?.earnUpselling),
      shouldDisplayEarnSimulator: isEnabled && Boolean(params?.earnSimulator),
    };
  }, [walletFeatureFlag]);
}

/** Keys for the wallet feature flags */
export const FEATURE_FLAG_KEYS = {
  desktop: "lwdWallet40",
  mobile: "lwmWallet40",
} as const;

/** Type for the wallet platform (desktop or mobile) */
export type WalletPlatform = "desktop" | "mobile";

/**
 * Symmetric, all-optional union of `lwdWallet40` and `lwmWallet40` params,
 * derived from the Zod registry in `@shared/feature-flags`. Keeping this
 * derived (rather than hand-written) means new params show up automatically
 * once the Zod schemas declare them.
 */
export type Wallet40Params = Partial<
  Features["lwdWallet40"]["params"] & Features["lwmWallet40"]["params"]
>;

/** Config interface with boolean getters for each param */
export interface WalletFeaturesConfig {
  /** Whether the feature flag is enabled */
  readonly isEnabled: boolean;
  /** Whether to show the market banner on portfolio */
  readonly shouldDisplayMarketBanner: boolean;
  /** Whether to show the graph rework UI */
  readonly shouldDisplayGraphRework: boolean;
  /** Whether to show quick action CTAs */
  readonly shouldDisplayQuickActionCtas: boolean;
  /** Whether to show the new receive options dialog (Lumen) */
  readonly shouldDisplayNewReceiveDialog: boolean;
  /** Whether to show the wallet 4.0 main navigation */
  readonly shouldDisplayWallet40MainNav: boolean;
  /** Whether onboarding should skip device setup and open portfolio in read-only mode */
  readonly shouldUseLazyOnboarding: boolean;
  /** Whether to show the balance refresh rework */
  readonly shouldDisplayBalanceRefreshRework: boolean;
  /** Whether to show the Wallet V4 Tour (e.g. drawer/dialog on Portfolio) */
  readonly shouldDisplayTour: boolean;
  /** Whether to show the asset section */
  readonly shouldDisplayAssetSection: boolean;
  /** Whether to show Braze content cards as ContentBanner (e.g. action cards on portfolio, mobile only) */
  readonly shouldDisplayBrazePlacement: boolean;
  /** Whether to show the TX History section */
  readonly shouldDisplayOperationsList: boolean;
  /** Whether to show the aggregated assets */
  readonly shouldDisplayAggregatedAssets: boolean;
  /** Whether to show the My Wallet component */
  readonly shouldDisplayMyWallet: boolean;
  /** Whether to show the PNL component */
  readonly shouldDisplayPnl: boolean;
  /** Whether to show the Asset Discoverability feature */
  readonly shouldDisplayAssetDiscoverability: boolean;
  /** Whether to show the Earn Upselling component */
  readonly shouldDisplayEarnUpselling: boolean;
  /** Whether to show the Earn Simulator component */
  readonly shouldDisplayEarnSimulator: boolean;
}
