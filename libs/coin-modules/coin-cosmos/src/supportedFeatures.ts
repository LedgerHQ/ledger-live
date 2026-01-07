import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs"],
  staking: ["staking_craft", "staking_history", "staking_stakes", "staking_rewards"],
  memo: ["memo_craft", "memo_history"],
  dApps: ["wallet_api"],
};
