import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import type { TransactionStatus } from "../..//generated/types";
import type { Transaction } from "./types";

import { AccountAddress } from "@aptos-labs/ts-sdk";

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: Record<string, any> = {};
  const warnings: Record<string, any> = {};

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || BigNumber(0);

  if (t.amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  const amount = t.amount;

  const totalSpent = BigNumber(t.amount).plus(estimatedFees);

  if (totalSpent.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (AccountAddress.isValid({ input: t.recipient }).valid === false) {
    errors.recipient = new InvalidAddress("", { currencyName: a.currency.name });
  } else if (t.recipient === a.freshAddress) {
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
