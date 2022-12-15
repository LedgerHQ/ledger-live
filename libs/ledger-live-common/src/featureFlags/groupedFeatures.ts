import { FeatureId } from "@ledgerhq/types-live";

/** Helper to group several feature flag ids under a common feature flag */
export const groupedFeatures: Record<
  string,
  {
    featureIds: FeatureId[];
    iconNameWeight?: string;
  }
> = {
  stax: {
    iconNameWeight: "StaxRegular",
    featureIds: [
      "customImage",
      "deviceInitialApps",
      "syncOnboarding",
      "llmNewDeviceSelection",
    ],
  },
  disableNft: {
    featureIds: [
      "disableNftSend",
      "disableNftLedgerMarket",
      "disableNftRaribleOpensea",
    ],
  },
};
