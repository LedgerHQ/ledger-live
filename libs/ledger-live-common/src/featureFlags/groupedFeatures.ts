import { FeatureId } from "@ledgerhq/types-live";

/** Helper to group several feature flag ids under a common feature flag */
export const groupedFeatures: Record<
  string,
  {
    featureIds: FeatureId[];
  }
> = {
  stax: {
    featureIds: ["supportDeviceStax", "deviceInitialApps", "staxWelcomeScreen"],
  },
  europa: {
    featureIds: ["supportDeviceEuropa", "deviceInitialApps"],
  },
  disableNft: {
    featureIds: ["disableNftLedgerMarket", "disableNftRaribleOpensea", "disableNftSend"],
  },
};
