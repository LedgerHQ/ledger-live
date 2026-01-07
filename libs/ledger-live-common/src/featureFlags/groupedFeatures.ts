import { FeatureId } from "@ledgerhq/types-live";

export type GroupedFeature =
  | "disableNft"
  | "blockchain"
  | "staking"
  | "nativeAsset"
  | "tokens"
  | "memo";

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
  blockchain: {
    featureIds: ["blockchainBlocks", "blockchainTxs"],
  },
  staking: {
    featureIds: ["stakingTxs", "stakingHistory", "stakingStakes", "stakingRewards"],
  },
  nativeAsset: {
    featureIds: ["nativeBalance", "nativeCraft", "nativeHistory"],
  },
  tokens: {
    featureIds: ["tokensBalance", "tokensCraft", "tokensHistory"],
  },
  memo: {
    featureIds: ["memoCraft", "memoHistory"],
  },
};
