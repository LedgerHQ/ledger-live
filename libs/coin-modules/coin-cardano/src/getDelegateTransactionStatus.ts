import { FeeNotLoaded } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { buildTransaction } from "./buildTransaction";
import { CardanoInvalidPoolId, CardanoNotEnoughFunds, CardanoStakeKeyDepositError } from "./errors";
import { isHexString } from "./logic";
import type { CardanoAccount, Transaction, TransactionStatus } from "./types";

export async function getDelegateTransactionStatus(
  account: CardanoAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = transaction.fees || new BigNumber(0);

  if (!transaction.poolId || !isHexString(transaction.poolId) || transaction.poolId.length !== 56) {
    errors.poolId = new CardanoInvalidPoolId();
  } else {
    try {
      await buildTransaction(account, transaction);
    } catch (e: any) {
      if (
        e.message.toLowerCase() === "not enough ada" ||
        e.message.toLowerCase() === "not enough tokens"
      ) {
        errors.amount = new CardanoNotEnoughFunds();
      } else {
        throw e;
      }
    }
  }

  const stakeKeyRegisterDeposit = new BigNumber(
    account.cardanoResources.protocolParams.stakeKeyDeposit,
  );
  if (
    !account.cardanoResources.delegation?.status &&
    account.spendableBalance.isLessThan(stakeKeyRegisterDeposit)
  ) {
    errors.amount = new CardanoStakeKeyDepositError("", {
      depositAmount: stakeKeyRegisterDeposit.div(1e6).toString(),
    });
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: estimatedFees,
  };
}
