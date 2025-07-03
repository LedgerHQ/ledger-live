import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/errors";
import { AccountId } from "@hashgraph/sdk";
import type { AccountBridge } from "@ledgerhq/types-live";
import { calculateAmount, getEstimatedFees } from "./utils";
import type { Transaction } from "../types";
import { isUpdateAccountTransaction } from "../logic";
import BigNumber from "bignumber.js";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
  const errors: Record<string, Error> = {};

  const isUpdateAccountFlow = isUpdateAccountTransaction(transaction);

  if (isUpdateAccountFlow) {
    const estimatedFees = await getEstimatedFees(account, "CryptoUpdate");
    const amount = BigNumber(0);
    const totalSpent = amount.plus(estimatedFees);

    // FIXME: validation of update account transaction

    return {
      amount: new BigNumber(0),
      errors,
      estimatedFees,
      totalSpent,
      warnings: {},
    };
  }

  if (!transaction.recipient || transaction.recipient.length === 0) {
    errors.recipient = new RecipientRequired("");
  } else {
    if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource("");
    }

    try {
      AccountId.fromString(transaction.recipient);
    } catch (err) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
  }

  const { amount, totalSpent } = await calculateAmount({
    transaction,
    account,
  });

  if (transaction.amount.eq(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (account.balance.isLessThan(totalSpent)) {
    errors.amount = new NotEnoughBalance("");
  }

  const estimatedFees = await getEstimatedFees(account, "CryptoTransfer");

  return {
    amount,
    errors,
    estimatedFees,
    totalSpent,
    warnings: {},
  };
};
