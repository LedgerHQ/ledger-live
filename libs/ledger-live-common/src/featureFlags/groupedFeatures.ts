import { FeatureId } from "@ledgerhq/types-live";

/** Helper to group several feature flag ids under a common feature flag */
export const groupedFeatures: Record<
  string,
  {
    featureIds: FeatureId[];
  }
> = {
  stax: {
    featureIds: [
      "supportDeviceStax",
      "deviceInitialApps",
      "llmNewDeviceSelection",
      "staxWelcomeScreen",
      "llmNewFirmwareUpdateUx",
    ],
  },
  europa: {
    featureIds: ["supportDeviceEuropa", "deviceInitialApps", "llmNewDeviceSelection"],
  },
  disableNft: {
    featureIds: ["disableNftLedgerMarket", "disableNftRaribleOpensea", "disableNftSend"],
  },
};
