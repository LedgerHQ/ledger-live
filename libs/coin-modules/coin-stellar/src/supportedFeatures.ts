import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs", "blockchain_blocks"],
  native_assets: ["native_craft", "native_balance", "native_history"],
  tokens: ["tokens_balance", "tokens_craft", "tokens_history"],
  memo: ["memo_craft", "memo_history"],
};
