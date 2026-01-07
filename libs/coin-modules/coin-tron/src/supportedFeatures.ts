import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_blocks", "blockchain_txs"],
  staking: ["staking_history", "staking_craft", "staking_stakes", "staking_rewards"],
  tokens: ["tokens_balance", "tokens_history", "tokens_craft"],
};
