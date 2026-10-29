import { FeatureId } from "@shared/feature-flags";

export const WALLET_FEATURES_FLAG: FeatureId = "lwdWallet40";

export const WALLET_FEATURES_PARAMS = [
  { key: "assetSection", label: "Asset Section" },
  {
    key: "brazePlacement",
    label: "Braze Placement",
  },
  { key: "assetDiscoverability", label: "Asset Discoverability" },
  { key: "earnUpselling", label: "Earn Upselling" },
  { key: "earnSimulator", label: "Earn Simulator" },
] as const;

export type WalletFeatureParamKey = (typeof WALLET_FEATURES_PARAMS)[number]["key"];
