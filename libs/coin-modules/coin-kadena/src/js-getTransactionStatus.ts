import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fetchCoinDetailsForAccount } from "./api/network";
import { Transaction, TransactionStatus } from "./types";
import { baseUnitToKda, getAddress, validateAddress } from "./utils";

type ValidatedTransactionFields = "recipient" | "amount";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

/**
 * Validate an address for a transaction
 */
export const validateRecipient = (account: Account, tx: Transaction): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};

  if (tx.recipient) {
    // Check if recipient is matching the format of a valid eth address or not
    const isRecipientValidate = validateAddress(tx.recipient);

    if (!isRecipientValidate) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
    if (account.freshAddress === tx.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource("", {
        currencyName: account.currency.name,
      });
    }
  } else {
    errors.recipient = new RecipientRequired(); // ""
  }

  return [errors];
};

/**
 * Validate the amount of a transaction for an account
 */
const validateAmount = async (a: Account, t: Transaction): Promise<Array<ValidationIssues>> => {
  const fees = t.gasPrice.multipliedBy(t.gasLimit);

  const totalSpent = t.amount.plus(fees);
  const errors: ValidationIssues = {};

  // if no amount or 0
  if (!t.amount || t.amount.isZero()) {
    errors.amount = new AmountRequired(); // "Amount required"
  } else {
    const balance = await fetchCoinDetailsForAccount(getAddress(a).address, [
      t.senderChainId.toString(),
    ]);
    const accountBalance = baseUnitToKda(balance[t.senderChainId]) ?? new BigNumber(0);

    if (totalSpent.isGreaterThan(accountBalance)) {
      // if not enough to make the transaction
      errors.amount = new NotEnoughBalance(); // "Sorry, insufficient funds"
    }
  }
  return [errors];
};

export const getTransactionStatus = async (
  a: Account,
  t: Transaction,
): Promise<TransactionStatus> => {
  // Recipient related errors and warnings
  const [recipientErr] = validateRecipient(a, t);
  // Amount related errors and warnings
  const [amountErr] = await validateAmount(a, t);

  const errors: ValidationIssues = {
    ...recipientErr,
    ...amountErr,
  };

  const fees = t.gasPrice.multipliedBy(t.gasLimit);

  return {
    amount: t.amount,
    errors,
    warnings: {},
    estimatedFees: fees,
    totalSpent: t.amount.plus(fees),
  };
};

export default getTransactionStatus;
