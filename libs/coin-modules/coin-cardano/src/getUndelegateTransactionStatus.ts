import { BigNumber } from "bignumber.js";
import { buildTransaction } from "./buildTransaction";
import { CardanoNotEnoughFunds } from "./errors";
import type { CardanoAccount, CardanoResources, Transaction, TransactionStatus } from "./types";

export async function getUndelegateTransactionStatus(
  account: CardanoAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const cardanoResources = account.cardanoResources as CardanoResources;

  const estimatedFees = transaction.fees || new BigNumber(0);

  if (!cardanoResources.delegation?.status) {
    throw new Error("StakeKey is not registered");
  }

  if (account.balance.eq(0)) {
    throw new CardanoNotEnoughFunds();
  }

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

  return {
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: estimatedFees,
  };
}
