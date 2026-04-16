import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isRecipientValid } from "../logic/validateAddress";
import { Transaction, TransactionStatus } from "../types";

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = new BigNumber(transaction.fee || 0);
  const totalSpent = new BigNumber(transaction.amount).plus(estimatedFees);
  const amount = new BigNumber(transaction.amount);

  if (!transaction.fee) {
    errors.fee = new FeeNotLoaded();
  } else if (totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughSpendableBalance();
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isRecipientValid(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!errors.amount && amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
