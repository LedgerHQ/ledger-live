import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/errors";
import { AccountId } from "@hashgraph/sdk";
import type { Transaction } from "./types";
import type { Account, TransactionStatus } from "../../types";
import { calculateAmount, estimatedFees } from "./utils";

export default async function getTransactionStatus(
  account: Account,
  transaction: Transaction
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};

  if (!transaction.recipient || transaction.recipient.length === 0) {
    errors.recipient = new RecipientRequired("");
  } else {
    if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource("");
    }

    try {
      AccountId.fromString(transaction.recipient);
    } catch (err) {
      errors.recipient = new InvalidAddress(`${err}`);
    }
  }

  const { amount, totalSpent } = await calculateAmount({
    transaction,
    account,
  });

  if (account.balance.isLessThan(totalSpent)) {
    errors.amount = new NotEnoughBalance("");
  } else if (amount.eq(0)) {
    errors.amount = new AmountRequired("");
  }

  return {
    amount,
    errors,
    estimatedFees,
    totalSpent,
    warnings: {},
  };
}
