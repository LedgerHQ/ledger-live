import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  GasLessThanEstimate,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import type { TransactionStatus } from "../..//generated/types";
import type { Transaction } from "./types";

import { isValidAddress, DEFAULT_GAS } from "./logic";
import {
  SequenseNumberTooNewError,
  SequenseNumberTooOldError,
  TransactionExpiredError,
} from "./errors";

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: Record<string, any> = {};
  const warnings: Record<string, any> = {};
  const useAllAmount = !!t.useAllAmount;

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || BigNumber(0);

  const amount = t.amount;

  const totalSpent = useAllAmount
    ? a.balance
    : BigNumber(t.amount).plus(estimatedFees);

  if (totalSpent.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress();
  }

  if (
    t.options.maxGasAmount &&
    t.estimate.maxGasAmount &&
    +t.options.maxGasAmount < +t.estimate.maxGasAmount
  ) {
    if (+t.options.maxGasAmount >= DEFAULT_GAS) {
      warnings.maxGasAmount = new GasLessThanEstimate();
    } else {
      errors.maxGasAmount = new GasLessThanEstimate();
    }
  }

  if (
    t.options.gasUnitPrice &&
    t.estimate.gasUnitPrice &&
    +t.options.gasUnitPrice < +t.estimate.gasUnitPrice
  ) {
    errors.gasUnitPrice = new GasLessThanEstimate();
  }

  if (t.errors?.sequenceNumber) {
    if (t.errors.sequenceNumber.includes("TOO_OLD")) {
      errors.sequenceNumber = new SequenseNumberTooOldError();
    } else if (t.errors.sequenceNumber.includes("TOO_NEW")) {
      errors.sequenceNumber = new SequenseNumberTooNewError();
    }
  }

  if (t.errors?.expirationTimestampSecs) {
    errors.expirationTimestampSecs = new TransactionExpiredError();
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
