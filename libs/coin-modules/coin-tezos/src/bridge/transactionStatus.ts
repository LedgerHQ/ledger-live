import BigNumber from "bignumber.js";
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
import { TezosAccount, Transaction, TransactionStatus } from "../types";
import { InvalidAddressBecauseAlreadyDelegated } from "../types/errors";
import api from "../api/tzkt";
import { isAccountDelegating } from "../api/bakers";
import { validateRecipient } from "./prepareTransaction";

const EXISTENTIAL_DEPOSIT = new BigNumber(275000);

export const getTransactionStatus = async (
  account: TezosAccount,
  t: Transaction,
): Promise<TransactionStatus> => {
  const errors: {
    recipient?: Error;
    amount?: Error;
    fees?: Error;
  } = {};

  const warnings: {
    amount?: Error;
    feeTooHigh?: Error;
    recipient?: Error;
  } = {};
  let resetTotalSpent = false;

  // Recipient validation logic
  if (t.mode !== "undelegate") {
    if (account.freshAddress === t.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else {
      const { recipientError, recipientWarning } = await validateRecipient(
        account.currency,
        t.recipient,
      );
      if (recipientError) {
        errors.recipient = recipientError;
      }
      if (recipientWarning) {
        warnings.recipient = recipientWarning;
      }
    }
  }

  // Pre validation of amount field
  const estimatedFees = t.estimatedFees || new BigNumber(0);
  if (t.mode === "send") {
    if (!errors.amount && t.amount.eq(0) && !t.useAllAmount) {
      resetTotalSpent = true;
      errors.amount = new AmountRequired();
    } else if (t.amount.gt(0) && estimatedFees.times(10).gt(t.amount)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }
    const thresholdWarning = 0.5 * 10 ** account.currency.units[0].magnitude;
    if (
      !errors.amount &&
      account.balance.minus(t.amount).minus(estimatedFees).lt(thresholdWarning)
    ) {
      if (isAccountDelegating(account)) {
        if (t.useAllAmount) {
          errors.amount = new RecommendUndelegation();
        } else {
          warnings.amount = new RecommendUndelegation();
        }
      }
    }
  }

  // effective amount
  // if we also have taquitoError, we interprete them and they override the previously inferred errors
  if (t.taquitoError) {
    log("taquitoerror", String(t.taquitoError));

    // remap taquito errors
    if (
      t.taquitoError.endsWith("balance_too_low") ||
      t.taquitoError.endsWith("subtraction_underflow")
    ) {
      if (t.mode === "send") {
        resetTotalSpent = true;
        errors.amount = new NotEnoughBalance();
      } else {
        errors.amount = new NotEnoughBalanceToDelegate();
      }
    } else if (t.taquitoError.endsWith("delegate.unchanged")) {
      errors.recipient = new InvalidAddressBecauseAlreadyDelegated();
    } else if (!errors.amount) {
      // unidentified error case
      errors.amount = new Error(t.taquitoError);
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
    t.mode === "send" &&
    t.amount.lt(EXISTENTIAL_DEPOSIT) &&
    (await api.getAccountByAddress(t.recipient)).type === "empty"
  ) {
    resetTotalSpent = true;
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: "0.275 XTZ",
    });
  }

  const result = {
    errors,
    warnings,
    estimatedFees,
    amount: t.amount,
    totalSpent: resetTotalSpent ? new BigNumber(0) : t.amount.plus(estimatedFees),
  };
  return Promise.resolve(result);
};
