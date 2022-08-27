import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { isValidAddress } from "./logic";
import { getMemoStrValid } from "./utils";
import { HeliumMemoTooLong } from "./errors";
import { TransactionStatus } from "./types";

/**
 *
 * @param a account
 * @param t transaction
 * @param errors
 * @param warnings
 * @returns object with errors and warning specific to transaction mode.
 */
const setTransactionStatus = (
  a: Account,
  t: Transaction,
  errors: Record<string, Error>,
  warnings: Record<string, Error>
): {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
} => {
  switch (t.model.mode) {
    case "send":
      if (!t.recipient) {
        errors.recipient = new RecipientRequired();
      } else if (!isValidAddress(t.recipient)) {
        errors.recipient = new InvalidAddress();
      } else if (t.model.mode === "send" && a.freshAddress === t.recipient) {
        errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
      }

      if (t.amount.lte(0) && !t.useAllAmount) {
        errors.amount = new AmountRequired();
      }

      if (t.model.memo && !getMemoStrValid(t.model.memo)) {
        errors.memo = new HeliumMemoTooLong();

        // LLM expects <transaction> as error key to disable continue button
        errors.transaction = errors.memo;
      }
      break;
    case "burn":
      if (!t.model.payee) {
        errors.payee = new RecipientRequired();
      }
      break;
    default:
      break;
  }
  return {
    errors,
    warnings,
  };
};

/**
 * Here are the list of the differents things we check
 * - Check if recipient is the same in case of send
 * - Check if recipient is valid
 * - Check if amounts are set
 * - Check if fees are loaded
 * - Check if memo is too long
 * @param a account
 * @param t transaction
 * @returns transaction status object
 */
const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!t.useAllAmount;

  const estimatedFees = t.fees || new BigNumber(0);

  const totalSpent = useAllAmount
    ? a.balance
    : new BigNumber(t.amount).plus(estimatedFees);

  const amount = useAllAmount
    ? a.balance.minus(estimatedFees)
    : new BigNumber(t.amount);

  if (totalSpent.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  return Promise.resolve({
    ...setTransactionStatus(a, t, errors, warnings),
    estimatedFees,
    amount,
    totalSpent,
  });
};

export default getTransactionStatus;
