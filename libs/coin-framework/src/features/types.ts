/**
 * Feature IDs as defined in https://ledgerhq.atlassian.net/wiki/spaces/CF/pages/6125551933/Coin+modules+-+ADR-003+-+Features+support
 * These represent the capabilities/features a coin module can support
 */
export type FeatureId =
  // Blockchain transaction features
  | "blockchain_txs"
  // Staking features
  | "staking_txs";

/**
 * Intent types for blockchain_txs feature
 */
export type BlockchainTxsIntent = "send";

/**
 * Intent types for staking_txs feature
 */
export type StakingTxsIntent =
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "claimReward"
  | "withdraw";

/**
 * Mapping from feature ID to its supported intents
 */
export type FeatureIntentMap = {
  blockchain_txs: BlockchainTxsIntent;
  staking_txs: StakingTxsIntent;
};

/**
 * A supported feature declaration in a coin module
 * Maps feature IDs to their supported intents
 * Example: { "blockchain_txs": ["send"], "staking_txs": ["delegate", "claimReward"] }
 */
export type SupportedFeatures = Partial<Record<FeatureId, string[]>>;

/**
 * Feature status in liveconfig
 */
export type FeatureStatus = "active" | "inactive";

/**
 * Feature configuration in liveconfig
 */
export type FeatureConfig = {
  id: FeatureId;
  status: FeatureStatus;
};

/**
 * Helper function to check if a feature is supported
 */
export function hasFeature(supportedFeatures: SupportedFeatures, featureId: FeatureId): boolean {
  return featureId in supportedFeatures;
}

/**
 * Helper function to check if an intent is supported for a feature
 */
export function hasIntent(
  supportedFeatures: SupportedFeatures,
  featureId: FeatureId,
  intent: string,
): boolean {
  const intents = supportedFeatures[featureId];
  return intents?.includes(intent) ?? false;
}
