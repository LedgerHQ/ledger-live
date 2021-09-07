import BigNumber from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/errors";
import * as hedera from "@hashgraph/sdk";
import type { Transaction } from "./types";
import type { Account, TransactionStatus } from "../../types";
import { calculateAmount } from "./utils";

export default async function getTransactionStatus(
  account: Account,
  transaction: Transaction
): Promise<TransactionStatus> {
  let errors: Record<string, Error> = {};


  if (!transaction.recipient || transaction.recipient.length === 0) {
    errors.recipient = new RecipientRequired("");
  } else {
    let senderAccountId = hedera.AccountId.fromString(account.seedIdentifier);

    try {
      let recipientAccountId = hedera.AccountId.fromString(transaction.recipient);

      if (senderAccountId.equals(recipientAccountId)) {
        errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource("");
      }
    } catch (err) {
      errors.recipient = new InvalidAddress(`${err}`);
    }
  }

  let { amount, estimatedFees, totalSpent } = calculateAmount({ transaction, account });

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
