import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs", "blockchain_blocks"],
  staking: ["staking_txs", "staking_history", "staking_stakes", "staking_rewards"],
  native_assets: ["native_craft", "native_balance", "native_history"],
};
