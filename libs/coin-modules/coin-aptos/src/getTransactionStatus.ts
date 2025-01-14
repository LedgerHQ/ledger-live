import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  GasLessThanEstimate,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";

import {
  SequenceNumberTooNewError,
  SequenceNumberTooOldError,
  TransactionExpiredError,
} from "./errors";
import { AccountAddress } from "@aptos-labs/ts-sdk";

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: Record<string, any> = {};
  const warnings: Record<string, any> = {};
  const useAllAmount = !!t.useAllAmount;

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || BigNumber(0);

  if (t.amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  const amount = t.amount;

  const totalSpent = useAllAmount ? a.balance : BigNumber(t.amount).plus(estimatedFees);

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

  if (
    t.options.maxGasAmount &&
    t.estimate.maxGasAmount &&
    +t.options.maxGasAmount < +t.estimate.maxGasAmount
  ) {
    errors.maxGasAmount = new GasLessThanEstimate();
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
      errors.sequenceNumber = new SequenceNumberTooOldError();
    } else if (t.errors.sequenceNumber.includes("TOO_NEW")) {
      errors.sequenceNumber = new SequenceNumberTooNewError();
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
