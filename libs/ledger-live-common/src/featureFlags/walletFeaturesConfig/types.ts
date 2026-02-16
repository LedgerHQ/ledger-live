export type WalletPlatform = "desktop" | "mobile";

export type Wallet40Params = {
  readonly marketBanner?: boolean;
  readonly graphRework?: boolean;
  readonly quickActionCtas?: boolean;
  readonly newReceiveDialog?: boolean;
  readonly mainNavigation?: boolean;
  readonly lazyOnboarding?: boolean;
};

export const FEATURE_FLAG_KEYS = {
  desktop: "lwdWallet40",
  mobile: "lwmWallet40",
} as const;

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
}
