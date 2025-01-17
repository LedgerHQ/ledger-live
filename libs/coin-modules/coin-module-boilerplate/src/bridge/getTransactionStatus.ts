import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { Transaction, TransactionStatus } from "../types";
import { isRecipientValid } from "../common-logic/utils";
import coinConfig from "../config";

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  // reserveAmount is the minimum amount of currency that an account must hold in order to stay activated
  const reserveAmount = new BigNumber(coinConfig.getCoinConfig().minReserve);
  const estimatedFees = new BigNumber(transaction.fee || 0);
  const totalSpent = new BigNumber(transaction.amount).plus(estimatedFees);
  const amount = new BigNumber(transaction.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    // if the fee is more than 10 times the amount, we warn the user that fee is high compared to what he is sending
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!transaction.fee) {
    // if the fee is not loaded, we can't do much
    errors.fee = new FeeNotLoaded();
  } else if (transaction.fee.eq(0)) {
    // On some chains, 0 fee could still work so this is optional
    errors.fee = new FeeRequired();
  } else if (totalSpent.gt(account.balance.minus(reserveAmount))) {
    // if the total spent is greater than the balance minus the reserve amount, tx is invalid
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: formatCurrencyUnit(account.currency.units[0], reserveAmount, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  } else if (transaction.recipient && transaction.amount.lt(reserveAmount)) {
    // if we send an amount lower than reserve amount AND target account is new, we need to warn the user that the target account will not be activated
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatCurrencyUnit(account.currency.units[0], reserveAmount, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (account.freshAddress === transaction.recipient) {
    // we want to prevent user from sending to themselves (even if it's technically feasible)
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isRecipientValid(transaction.recipient)) {
    // We want to prevent user from sending to an invalid address
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!errors.amount && amount.eq(0)) {
    // if the amount is 0, we prevent the user from sending the tx (even if it's technically feasible)
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
