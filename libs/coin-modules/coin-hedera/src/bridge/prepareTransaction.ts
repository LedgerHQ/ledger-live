import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { StakingTransactionProperties, Transaction } from "../types";
import { getHederaOperationType, isStakingTransaction } from "../logic";
import { calculateAmount, getEstimatedFees } from "./utils";

const mapStakingModeToMemo: Record<StakingTransactionProperties["mode"], string> = {
  claimRewards: "Collect Staking Rewards",
  delegate: "Stake",
  undelegate: "Unstake",
  redelegate: "Restake",
} as const;

/**
 * Gather any more neccessary information for a transaction,
 * potentially from a network.
 *
 * Hedera has fully client-side transactions and the fee
 * is not possible to estimate ahead-of-time.
 *
 * @returns  {Transaction}
 */
export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const operationType = getHederaOperationType(transaction);

  // explicitly calculate transaction amount to account for `useAllAmount` flag (send max flow)
  // i.e. if `useAllAmount` has been toggled to true, this is where it will update the transaction to reflect that action
  const [{ amount }, estimatedFees] = await Promise.all([
    calculateAmount({ account, transaction }),
    getEstimatedFees(account, operationType),
  ]);

  transaction.amount = amount;
  transaction.maxFee = estimatedFees;

  if (isStakingTransaction(transaction)) {
    // claiming staking rewards is triggered by sending 1 tinybar to staking reward account
    if (transaction.properties.mode === "claimRewards") {
      transaction.recipient = getEnv("HEDERA_STAKING_REWARD_ACCOUNT_ID");
      transaction.amount = new BigNumber(1);
    }

    transaction.memo = mapStakingModeToMemo[transaction.properties.mode];
  }

  return transaction;
};
