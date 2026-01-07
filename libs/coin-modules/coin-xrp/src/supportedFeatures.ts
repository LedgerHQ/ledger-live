import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs", "blockchain_blocks"],
  memo: ["memo_craft", "memo_history"],
  dApps: ["wallet_api"],
};
