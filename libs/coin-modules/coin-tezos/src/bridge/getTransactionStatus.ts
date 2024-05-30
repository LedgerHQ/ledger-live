import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceToDelegate,
  RecommendUndelegation,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { InvalidAddressBecauseAlreadyDelegated } from "../types/errors";
import { validateRecipient } from "../logic";
import { isAccountDelegating } from "../network/bakers";
import api from "../network/tzkt";
import { Transaction } from "../types";

const EXISTENTIAL_DEPOSIT = new BigNumber(275000);

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  let resetTotalSpent = false;

  // Recipient validation logic
  if (transaction.mode !== "undelegate") {
    if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else {
      const { recipientError, recipientWarning } = await validateRecipient(transaction.recipient);
      if (recipientError) {
        errors.recipient = recipientError;
      }
      if (recipientWarning) {
        warnings.recipient = recipientWarning;
      }
    }
  }

  // Pre validation of amount field
  const estimatedFees = transaction.estimatedFees || new BigNumber(0);
  if (transaction.mode === "send") {
    if (!errors.amount && transaction.amount.eq(0) && !transaction.useAllAmount) {
      resetTotalSpent = true;
      errors.amount = new AmountRequired();
    } else if (transaction.amount.gt(0) && estimatedFees.times(10).gt(transaction.amount)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }
    const thresholdWarning = 0.5 * 10 ** account.currency.units[0].magnitude;
    if (
      !errors.amount &&
      account.balance.minus(transaction.amount).minus(estimatedFees).lt(thresholdWarning)
    ) {
      if (isAccountDelegating(account)) {
        if (transaction.useAllAmount) {
          errors.amount = new RecommendUndelegation();
        } else {
          warnings.amount = new RecommendUndelegation();
        }
      }
    }
  }

  // effective amount
  // if we also have taquitoError, we interprete them and they override the previously inferred errors
  if (transaction.taquitoError) {
    log("taquitoerror", String(transaction.taquitoError));

    // remap taquito errors
    if (
      transaction.taquitoError.endsWith("balance_too_low") ||
      transaction.taquitoError.endsWith("subtraction_underflow")
    ) {
      if (transaction.mode === "send") {
        resetTotalSpent = true;
        errors.amount = new NotEnoughBalance();
      } else {
        errors.amount = new NotEnoughBalanceToDelegate();
      }
    } else if (transaction.taquitoError.endsWith("delegate.unchanged")) {
      errors.recipient = new InvalidAddressBecauseAlreadyDelegated();
    } else if (!errors.amount) {
      // unidentified error case
      errors.amount = new Error(transaction.taquitoError);
      resetTotalSpent = true;
    }
  }

  if (!errors.amount && account.balance.lte(0)) {
    resetTotalSpent = true;
    errors.amount = new NotEnoughBalance();
  }

  // Catch a specific case that requires a minimum amount
  if (
    !errors.amount &&
    transaction.mode === "send" &&
    transaction.amount.lt(EXISTENTIAL_DEPOSIT) &&
    (await api.getAccountByAddress(transaction.recipient)).type === "empty"
  ) {
    resetTotalSpent = true;
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: "0.275 XTZ",
    });
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: transaction.amount,
    totalSpent: resetTotalSpent ? new BigNumber(0) : transaction.amount.plus(estimatedFees),
  };
};
