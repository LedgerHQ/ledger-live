import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs"],
  staking: ["staking_txs"],
  memos: ["memo_craft", "memo_history"],
};
