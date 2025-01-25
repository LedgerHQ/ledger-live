import { FeatureId } from "@ledgerhq/types-live";

export type GroupedFeature = "disableNft";

/** Helper to group several feature flag ids under a common feature flag */
export const groupedFeatures: Record<
  GroupedFeature,
  {
    featureIds: FeatureId[];
  }
> = {
  disableNft: {
    featureIds: ["disableNftLedgerMarket", "disableNftRaribleOpensea", "disableNftSend"],
  },
};
