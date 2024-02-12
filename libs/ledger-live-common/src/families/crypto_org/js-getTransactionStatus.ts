import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import { isValidAddress } from "./logic";

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: {
    fees?: Error;
    amount?: Error;
    recipient?: Error;
  } = {};
  const warnings = {};
  const useAllAmount = !!t.useAllAmount;

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || new BigNumber(0);
  const totalSpent = useAllAmount ? a.balance : new BigNumber(t.amount).plus(estimatedFees);
  const amount = useAllAmount ? a.balance.minus(estimatedFees) : new BigNumber(t.amount);

  if (totalSpent.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!amount.gt(0)) {
    errors.amount = new AmountRequired();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(t.recipient, a.currency.id)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  } else if (t.mode === "send" && a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

export default getTransactionStatus;
