import { FeatureId } from "@ledgerhq/types-live";

export const WALLET_FEATURES_FLAG: FeatureId = "lwdWallet40";

export const WALLET_FEATURES_PARAMS = [
  { key: "marketBanner", label: "Market Banner" },
  { key: "graphRework", label: "Graph & Balance Rework" },
  { key: "quickActionCtas", label: "Quick Action CTAs" },
  { key: "mainNavigation", label: "Main Navigation" },
  { key: "tour", label: "Tour" },
  { key: "newReceiveDialog", label: "New Receive Dialog" },
] as const;

export type WalletFeatureParamKey = (typeof WALLET_FEATURES_PARAMS)[number]["key"];
