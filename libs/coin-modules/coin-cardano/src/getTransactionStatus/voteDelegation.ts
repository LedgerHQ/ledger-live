import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { buildTransaction } from "../buildTransaction";
import {
  CardanoInvalidDRepId,
  CardanoNotEnoughFunds,
  CardanoStakeKeyDepositError,
} from "../errors";
import { parseDRepId } from "../drep";
import type { CardanoAccount, Transaction, TransactionStatus } from "../types";
import { isRecoverableBuildError } from "./buildErrors";

export async function getVoteDelegationTransactionStatus(
  account: CardanoAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const estimatedFees = transaction.fees ?? new BigNumber(0);

  if (!transaction.fees) errors.fees = new FeeNotLoaded();
  if (!transaction.voteDelegationTarget) {
    errors.voteDelegationTarget = new CardanoInvalidDRepId("Vote delegation target is required");
  } else if (transaction.voteDelegationTarget.type === "drep") {
    try {
      parseDRepId(transaction.voteDelegationTarget.drepId);
    } catch (error) {
      errors.voteDelegationTarget = error as CardanoInvalidDRepId;
    }
  }

  const deposit = account.cardanoResources.delegation?.status
    ? new BigNumber(0)
    : new BigNumber(account.cardanoResources.protocolParams.stakeKeyDeposit);
  if (account.spendableBalance.lt(estimatedFees.plus(deposit))) {
    errors.amount = deposit.gt(0)
      ? new CardanoStakeKeyDepositError("", { depositAmount: deposit.div(1e6).toString() })
      : new CardanoNotEnoughFunds();
  } else if (!errors.voteDelegationTarget) {
    try {
      await buildTransaction(account, transaction);
    } catch (error) {
      if (isRecoverableBuildError(error)) errors.amount = new CardanoNotEnoughFunds();
      else throw error;
    }
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: estimatedFees.plus(deposit),
  };
}
