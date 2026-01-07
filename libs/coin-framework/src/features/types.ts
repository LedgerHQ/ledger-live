/**
 * Feature intent types
 */
export type BlockchainTxsFeatures = "blockchain_blocks" | "blockchain_txs";
export type StakingTxsFeatures =
  | "staking_craft"
  | "staking_history"
  | "staking_stakes"
  | "staking_rewards";
export type NativeAssetsFeatures = "native_craft" | "native_balance" | "native_history";
export type DAppsFeatures = "wallet_api";
export type TokensFeature = "tokens_balance" | "tokens_history" | "tokens_craft";
export type GasOptionsFeature = "token_craft_gas";
export type MemosFeature = "memo_craft" | "memo_history";

/**
 * Union of all feature intent types
 */
export type Feature =
  | BlockchainTxsFeatures
  | StakingTxsFeatures
  | NativeAssetsFeatures
  | DAppsFeatures
  | TokensFeature
  | GasOptionsFeature
  | MemosFeature;

/**
 * Mapping from feature category to its supported intents
 */
export type FeaturesMap = {
  blockchain?: BlockchainTxsFeatures[];
  staking?: StakingTxsFeatures[];
  native_assets?: NativeAssetsFeatures[];
  dApps?: DAppsFeatures[];
  memo?: MemosFeature[];
  tokens?: TokensFeature[];
  gasOptions?: GasOptionsFeature[];
};

/**
 * Extract the feature type for a given feature key
 */
export type FeatureValue<K extends keyof FeaturesMap> = NonNullable<FeaturesMap[K]>[number];

/**
 * Alias for FeaturesMap for backward compatibility
 */
export type SupportedFeatures = FeaturesMap;

/**
 * Feature category identifier
 */
export type FeatureId = keyof FeaturesMap;

/**
 * Feature configuration type
 */
export type FeatureConfig = {
  id: FeatureId;
  status: "active" | "inactive";
};
