import type { Transaction, ZilliqaAccount } from "./types";
import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  FeeTooHigh,
} from "@ledgerhq/errors";
import { isInvalidRecipient } from "../../bridge/mockHelpers";
import { BN } from "@zilliqa-js/util";
import { ZILLIQA_TX_GAS_LIMIT } from "./api";

export const getTransactionStatus = (
  account: ZilliqaAccount,
  t: Transaction
) => {
  const errors: any = {};
  const warnings: any = {};
  const useAllAmount = !!t.useAllAmount;

  let { gasPrice, gasLimit } = t;
  if (!gasPrice) {
    gasPrice = new BN(0);
  }

  if (!gasLimit) {
    gasLimit = new BN(ZILLIQA_TX_GAS_LIMIT);
  }

  const estimatedFees = new BigNumber(gasPrice.mul(gasLimit).toString());

  const totalSpent = useAllAmount
    ? account.balance
    : BigNumber(t.amount).plus(estimatedFees);

  const amount = useAllAmount
    ? account.balance.minus(estimatedFees)
    : BigNumber(t.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.amount = new FeeTooHigh();
  }

  if (!errors.amount && !amount.gt(0)) {
    errors.amount = useAllAmount
      ? new NotEnoughBalance()
      : new AmountRequired();
  } else if (totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (t.recipient === account.freshAddress) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (isInvalidRecipient(t.recipient)) {
    errors.recipient = new InvalidAddress();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};
