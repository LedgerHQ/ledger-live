// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-stacks/types/index";

import type { Stake } from "@ledgerhq/coin-module-framework/api/index";
import type { Account } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type StakingPosition = Omit<Stake, "amount" | "amountDeposited" | "amountRewarded"> & {
  amount: BigNumber;
  amountDeposited?: BigNumber;
  amountRewarded?: BigNumber;
};

export type StacksAccount = Account & { stakingPositions?: StakingPosition[] };

export function isStacksAccount(account: Account): account is StacksAccount {
  return account.currency.family === "stacks";
}
