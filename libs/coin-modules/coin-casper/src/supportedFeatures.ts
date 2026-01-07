import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs"],
  staking: ["staking_craft"],
  memo: ["memo_craft", "memo_history"],
};
