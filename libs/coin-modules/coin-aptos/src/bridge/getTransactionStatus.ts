import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionStatus } from "../types";

import { AccountAddress } from "@aptos-labs/ts-sdk";
import { getTokenAccount } from "./logic";

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings = {};

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  }

  if (!AccountAddress.isValid({ input: t.recipient }).valid && !errors.recipient) {
    errors.recipient = new InvalidAddress("", { currencyName: a.currency.name });
  }

  if (t.recipient === a.freshAddress && !errors.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || BigNumber(0);

  if (t.amount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  const tokenAccount = getTokenAccount(a, t);

  const amount = t.useAllAmount
    ? tokenAccount
      ? BigNumber(tokenAccount.spendableBalance)
      : BigNumber(
          a.spendableBalance.minus(estimatedFees).isLessThan(0)
            ? 0
            : a.spendableBalance.minus(estimatedFees),
        )
    : BigNumber(t.amount);

  const totalSpent = BigNumber(amount.plus(estimatedFees));

  if (
    tokenAccount
      ? tokenAccount.spendableBalance.isLessThan(totalSpent) &&
        a.spendableBalance.isLessThan(estimatedFees)
      : a.spendableBalance.isLessThan(totalSpent) && !errors.amount
  ) {
    errors.amount = new NotEnoughBalance();
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
