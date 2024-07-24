import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Account, AccountBridge, SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TonCommentInvalid } from "./errors";
import { Transaction, TransactionStatus } from "./types";
import { addressesAreEqual, commentIsValid, isAddressValid } from "./utils";

type ValidatedTransactionFields = "recipient" | "sender" | "amount" | "comment";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

/**
 * Validate an address for account transaction
 */
const validateRecipient = (account: Account, tx: Transaction): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};

  if (tx.recipient) {
    // Check if recipient is matching the format of account valid eth address or not
    const isRecipientValidate = isAddressValid(tx.recipient);

    if (!isRecipientValidate) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
    if (addressesAreEqual(account.freshAddress, tx.recipient)) {
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
 * Validate the sender address for account transaction
 */
const validateSender = (account: Account): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};

  // Check if sender is matching the format of account valid ton address or not
  const isSenderValidate = isAddressValid(account.freshAddress);

  if (!isSenderValidate) {
    errors.sender = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  return [errors];
};

const validateAmount = (
  account: Account | SubAccount,
  transaction: Transaction,
  totalSpent: BigNumber,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  // if no amount or 0
  if (!transaction.amount || transaction.amount.isZero()) {
    errors.amount = new AmountRequired(); // "Amount required"
  } else if (totalSpent.isGreaterThan(account.balance)) {
    // if not enough to make the transaction
    errors.amount = new NotEnoughBalance(); // "Sorry, insufficient funds"
  }

  return [errors, warnings];
};

const validateComment = (transaction: Transaction): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};

  // if the comment isn'transaction encrypted, it should be valid
  if (transaction.comment.isEncrypted || !commentIsValid(transaction.comment)) {
    errors.comment = new TonCommentInvalid();
  }
  return [errors];
};

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const totalSpent = transaction.amount.plus(transaction.fees);

  // Recipient related errors and warnings
  const [recipientErr] = validateRecipient(account, transaction);
  // Sender related errors and warnings
  const [senderErr] = validateSender(account);
  // Amount related errors and warnings
  const [amountErr, amountWarn] = validateAmount(account, transaction, totalSpent);
  // Comment related errors and warnings
  const [commentErr] = validateComment(transaction);

  const errors: ValidationIssues = {
    ...recipientErr,
    ...senderErr,
    ...amountErr,
    ...commentErr,
  };

  const warnings: ValidationIssues = {
    ...amountWarn,
  };

  return {
    amount: transaction.amount,
    errors,
    warnings,
    estimatedFees: transaction.fees,
    totalSpent,
  };
};

export default getTransactionStatus;
