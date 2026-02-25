import type { SupportedFeatures } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: SupportedFeatures = {
  blockchain_txs: ["send"],
  staking_txs: ["delegate", "undelegate", "claimReward", "withdraw"],
};
