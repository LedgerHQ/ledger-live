import { FeatureId } from "@shared/feature-flags";

export const WALLET_FEATURES_FLAG: FeatureId = "lwdWallet40";

export const WALLET_FEATURES_PARAMS = [
  { key: "marketBanner", label: "Market Banner" },
  { key: "graphRework", label: "Graph & Balance Rework" },
  { key: "quickActionCtas", label: "Quick Action CTAs" },
  { key: "mainNavigation", label: "Main Navigation" },
  { key: "tour", label: "Tour" },
  { key: "q2Tour", label: "Q2 Tour" },
  { key: "balanceRefreshRework", label: "Balance Refresh Rework" },
  { key: "assetSection", label: "Asset Section" },
  {
    key: "brazePlacement",
    label: "Braze Placement",
  },
  { key: "operationsList", label: "TX History" },
  { key: "aggregatedAssets", label: "Aggregated Assets" },
  { key: "myWallet", label: "My Wallet" },
  { key: "assetDiscoverability", label: "Asset Discoverability" },
  { key: "pnl", label: "PnL" },
  { key: "earnUpselling", label: "Earn Upselling" },
  { key: "earnSimulator", label: "Earn Simulator" },
] as const;

export type WalletFeatureParamKey = (typeof WALLET_FEATURES_PARAMS)[number]["key"];
