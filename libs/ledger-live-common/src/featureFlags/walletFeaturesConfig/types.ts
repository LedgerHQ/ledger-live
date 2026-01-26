export type WalletPlatform = "desktop" | "mobile";

export type Wallet40Params = {
  readonly marketBanner?: boolean;
  readonly graphRework?: boolean;
  readonly quickActionCtas?: boolean;
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
}
