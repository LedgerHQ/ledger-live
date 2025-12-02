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
 * Memo field type configuration
 */
export type MemoType =
  | "text" // Simple text memo (cosmos, solana, algorand)
  | "tag" // Numeric tag (xrp destination tag, casper transfer id)
  | "typed"; // Typed memo with predefined options (stellar)

/**
 * Input field types for descriptors
 */
export type InputFieldType = "text" | "number" | "tag" | "typed";

/**
 * Input field descriptor for a transaction flow
 */
export type InputDescriptor = Readonly<{
  type: InputFieldType;
  maxLength?: number;
  maxValue?: number;
  options?: readonly string[];
  supportsDomain?: boolean; // Whether the field supports domain names (ENS for EVM)
}>;

/**
 * Fee input options
 */
export type FeeDescriptor = {
  hasPresets: boolean;
  hasCustom: boolean;
  hasCoinControl?: boolean;
};

/**
 * Send flow descriptor defining inputs for the send transaction
 */
export type SendDescriptor = {
  inputs: {
    recipientSupportsDomain?: boolean; // Whether recipient field supports domain names (ENS for EVM)
    memo?: InputDescriptor;
  };
  fees: FeeDescriptor;
};

/**
 * Complete flow descriptors for a coin
 */
export type CoinDescriptor = {
  send: SendDescriptor;
  // Future: stake, swap, etc.
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
