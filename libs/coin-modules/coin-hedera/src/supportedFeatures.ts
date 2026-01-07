import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs"],
  memos: ["memo_craft", "memo_history"],
  tokens: ["tokens_balance", "tokens_history", "tokens_craft"],
};
