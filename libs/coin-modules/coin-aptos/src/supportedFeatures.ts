import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs"],
  staking: ["staking_txs"],
  tokens: ["tokens_balance", "tokens_history", "tokens_craft"],
};
