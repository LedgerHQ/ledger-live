import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";

import type { IconAccount, Transaction, TransactionStatus } from "./types";

import {
  EXISTENTIAL_DEPOSIT,
  EXISTENTIAL_DEPOSIT_RECOMMENDED_MARGIN,
  FEES_SAFETY_BUFFER,
  calculateAmount,
  getMinimumBalance,
  isSelfTransaction,
  isValidAddress,
} from "./logic";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { IconAllFundsWarning, IconDoMaxSendInstead } from "./errors";
import { getAccount } from "./api";

const getSendTransactionStatus = async (
  a: IconAccount,
  t: Transaction,
): Promise<TransactionStatus> => {
  const errors: any = {};
  const warnings: any = {};

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (isSelfTransaction(a, t)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  }

  const estimatedFees = t.fees || new BigNumber(0);
  const amount = calculateAmount({
    a,
    t,
  });

  const totalSpent = amount.plus(estimatedFees);
  if (amount.lte(0) && !t.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  const minimumBalanceExistential = getMinimumBalance(a);
  const leftover = a.spendableBalance.minus(totalSpent);
  if (minimumBalanceExistential.gt(0) && leftover.lt(minimumBalanceExistential) && leftover.gt(0)) {
    errors.amount = new IconDoMaxSendInstead("", {
      minimumBalance: formatCurrencyUnit(a.currency.units[0], EXISTENTIAL_DEPOSIT, {
        showCode: true,
      }),
    });
  } else if (
    !errors.amount &&
    !t.useAllAmount &&
    a.spendableBalance.lte(EXISTENTIAL_DEPOSIT.plus(EXISTENTIAL_DEPOSIT_RECOMMENDED_MARGIN))
  ) {
    errors.amount = new NotEnoughBalance();
  } else if (totalSpent.gt(a.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (
    !errors.amount &&
    new BigNumber(a.iconResources?.totalDelegated).plus(a.iconResources?.votingPower).gt(0) &&
    (t.useAllAmount || a.spendableBalance.minus(totalSpent).lt(FEES_SAFETY_BUFFER))
  ) {
    warnings.amount = new IconAllFundsWarning();
  }

  if (
    !errors.recipient &&
    amount.lt(EXISTENTIAL_DEPOSIT) &&
    (await getAccount(t.recipient, a.currency)) === null
  ) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatCurrencyUnit(a.currency.units[0], EXISTENTIAL_DEPOSIT, {
        showCode: true,
      }),
    });
  }

  if (totalSpent.gt(a.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }
  
  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? new BigNumber(0) : amount,
    totalSpent,
  });
};

const getTransactionStatus = async (a: IconAccount, t: Transaction): Promise<TransactionStatus> => {
  const errors: {
    staking?: Error;
    amount?: Error;
    recipient?: Error;
    unbondings?: Error;
  } = {};
  const warnings: {
    amount?: Error;
  } = {};

  switch (t.mode) {
    case "send": {
      return await getSendTransactionStatus(a, t);
    }
    default: {
      break;
    }
  }

  const amount = calculateAmount({
    a,
    t,
  });
  const estimatedFees = t.fees || new BigNumber(0);
  const totalSpent = amount.plus(estimatedFees);
  if (totalSpent.gt(a.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }
  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? new BigNumber(0) : amount,
    totalSpent,
  });
};

export default getTransactionStatus;
