import type { FeatureId } from "./data/schema";

/**
 * @deprecated Legacy mechanism to batch-toggle related flags under a single
 * name. Ported as-is from `live-common/featureFlags/groupedFeatures.ts` for
 * backward compatibility. Should be removed once consumers no longer rely on it.
 */
export type GroupedFeature = "disableNft";

/** @deprecated See `GroupedFeature`. */
export const groupedFeatures: Record<
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  GroupedFeature,
  {
    featureIds: FeatureId[];
  }
> = {
  disableNft: {
    featureIds: ["disableNftLedgerMarket", "disableNftRaribleOpensea", "disableNftSend"],
  },
};
