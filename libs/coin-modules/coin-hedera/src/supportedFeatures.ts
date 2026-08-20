import type { SupportedFeatures } from "@ledgerhq/coin-module-framework/features/types";

// `blockchain_txs` has no separate intent for token transfers or association — "send" already
// covers both (see `craftTransaction`'s HTS/ERC20/changeTrust branches). `staking_txs` lists the four
// staking modes coin-hedera actually implements (`logic/craftTransaction.ts`, `validateIntent.ts`);
// `withdraw` isn't one of them — Hedera has no separate unbonding-withdrawal step.
export const supportedFeatures: SupportedFeatures = {
  blockchain_txs: ["send"],
  staking_txs: ["delegate", "undelegate", "redelegate", "claimReward"],
};
