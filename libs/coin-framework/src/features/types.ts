/**
 * Intent types for blockchain_txs feature
 */
export type BlockchainTxsFeatures = "blockchain_blocks" | "blockchain_txs";

/**
 * Intent types for staking_txs feature
 */
export type StakingTxsFeatures =
  | "staking_txs"
  | "staking_history"
  | "staking_stakes"
  | "staking_rewards";

export type NativeAssetsFeatures = "native_craft" | "native_balance" | "native_history";
export type DAppsFeatures = "wallet_api";
export type TokensFeature = "tokens_balance" | "tokens_history" | "tokens_craft";
export type GasOptionsFeature = "token_craft_gas";
export type MemosFeature = "memo_craft" | "memo_history";

export type Feature =
  | BlockchainTxsFeatures
  | StakingTxsFeatures
  | NativeAssetsFeatures
  | DAppsFeatures
  | TokensFeature
  | GasOptionsFeature
  | MemosFeature;

/**
 * Mapping from feature ID to its supported intents
 */
export type FeaturesMap = {
  blockchain?: BlockchainTxsFeatures[];
  staking?: StakingTxsFeatures[];
  native_assets?: NativeAssetsFeatures[];
  dApps?: DAppsFeatures[];
  memos?: MemosFeature[];
  tokens?: TokensFeature[];
  gasOptions?: GasOptionsFeature[];
};

/**
 * Alias for FeaturesMap for backward compatibility
 */
export type SupportedFeatures = FeaturesMap;

/**
 * Feature ID type - represents a feature identifier
 */
export type FeatureId = keyof FeaturesMap;

/**
 * Feature configuration type
 */
export type FeatureConfig = {
  id: FeatureId;
  status: "active" | "inactive";
};
