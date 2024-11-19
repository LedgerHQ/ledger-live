import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
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

export const getSendTransactionStatus = async (
  account: IconAccount,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const errors: any = {};
  const warnings: any = {};

  // Check if fees are loaded
  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  // Validate recipient
  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (isSelfTransaction(account, transaction)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  const estimatedFees = transaction.fees || new BigNumber(0);
  const amount = calculateAmount({ account, transaction });
  const totalSpent = amount.plus(estimatedFees);

  // Check if amount is valid
  if (amount.lte(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  } else {
    const minimumBalanceExistential = getMinimumBalance(account);
    const leftover = account.spendableBalance.minus(totalSpent);
    if (
      minimumBalanceExistential.gt(0) &&
      leftover.lt(minimumBalanceExistential) &&
      leftover.gt(0)
    ) {
      errors.amount = new IconDoMaxSendInstead(
        "Balance cannot be below {{minimumBalance}}. Send max to empty account.",
        {
          minimumBalance: formatCurrencyUnit(account.currency.units[0], EXISTENTIAL_DEPOSIT, {
            showCode: true,
          }),
        },
      );
    } else if (
      !errors.amount &&
      !transaction.useAllAmount &&
      account.spendableBalance.lte(EXISTENTIAL_DEPOSIT.plus(EXISTENTIAL_DEPOSIT_RECOMMENDED_MARGIN))
    ) {
      errors.amount = new NotEnoughBalance();
    } else if (totalSpent.gt(account.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }

    if (
      !errors.amount &&
      new BigNumber(account.iconResources?.totalDelegated)
        .plus(account.iconResources?.votingPower)
        .gt(0) &&
      (transaction.useAllAmount ||
        account.spendableBalance.minus(totalSpent).lt(FEES_SAFETY_BUFFER))
    ) {
      warnings.amount = new IconAllFundsWarning();
    }

    if (totalSpent.gt(account.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? new BigNumber(0) : amount,
    totalSpent,
  });
};

export const getTransactionStatus = async (
  account: IconAccount,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  switch (transaction.mode) {
    case "send":
      return await getSendTransactionStatus(account, transaction);
    default: {
      const errors: { amount?: Error; recipient?: Error } = {};
      const warnings: { amount?: Error } = {};

      const amount = calculateAmount({ account, transaction });
      const estimatedFees = transaction.fees || new BigNumber(0);
      const totalSpent = amount.plus(estimatedFees);

      if (totalSpent.gt(account.spendableBalance)) {
        errors.amount = new NotEnoughBalance();
      }

      // Validate amount
      if (amount.lte(0) && !transaction.useAllAmount) {
        errors.amount = new AmountRequired();
      }

      return {
        errors,
        warnings,
        estimatedFees,
        amount: amount.lt(0) ? new BigNumber(0) : amount,
        totalSpent,
      };
    }
  }
};
