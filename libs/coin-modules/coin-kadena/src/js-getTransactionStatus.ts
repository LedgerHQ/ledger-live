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
import { baseUnitToKda, validateAddress } from "./utils";

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
const validateAmount = async (
  account: Account,
  transaction: Transaction,
): Promise<Array<ValidationIssues>> => {
  const fees = transaction.gasPrice.multipliedBy(transaction.gasLimit);

  const totalSpent = transaction.amount.plus(fees);
  const errors: ValidationIssues = {};

  // if no amount or 0
  if (!transaction.amount || transaction.amount.isZero()) {
    errors.amount = new AmountRequired(); // "Amount required"
  } else {
    const balance = await fetchCoinDetailsForAccount(account.freshAddress, [
      transaction.senderChainId.toString(),
    ]);
    const accountBalance = baseUnitToKda(balance[transaction.senderChainId]) ?? new BigNumber(0);

    if (totalSpent.isGreaterThan(accountBalance)) {
      // if not enough to make the transaction
      errors.amount = new NotEnoughBalance(); // "Sorry, insufficient funds"
    }
  }
  return [errors];
};

export const getTransactionStatus = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  // Recipient related errors and warnings
  const [recipientErr] = validateRecipient(account, transaction);
  // Amount related errors and warnings
  const [amountErr] = await validateAmount(account, transaction);

  const errors: ValidationIssues = {
    ...recipientErr,
    ...amountErr,
  };

  const fees = transaction.gasPrice.multipliedBy(transaction.gasLimit);

  return {
    amount: transaction.amount,
    errors,
    warnings: {},
    estimatedFees: fees,
    totalSpent: transaction.amount.plus(fees),
  };
};

export default getTransactionStatus;
