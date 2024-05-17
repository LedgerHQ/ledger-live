import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Account, SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TonCommentInvalid, TonExcessFee } from "./errors";
import { Transaction, TransactionStatus } from "./types";
import { addressesAreEqual, commentIsValid, getAddress, isAddressValid } from "./utils";

type ValidatedTransactionFields = "recipient" | "sender" | "amount" | "comment";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

/**
 * Validate an address for a transaction
 */
export const validateRecipient = (account: Account, tx: Transaction): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const { address } = getAddress(account);

  if (tx.recipient) {
    // Check if recipient is matching the format of a valid eth address or not
    const isRecipientValidate = isAddressValid(tx.recipient);

    if (!isRecipientValidate) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
    if (addressesAreEqual(address, tx.recipient)) {
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
 * Validate the sender address for a transaction
 */
export const validateSender = (account: Account): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const { address } = getAddress(account);

  // Check if sender is matching the format of a valid ton address or not
  const isSenderValidate = isAddressValid(address);

  if (!isSenderValidate) {
    errors.sender = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  return [errors];
};

const validateAmount = (
  a: Account | SubAccount,
  t: Transaction,
  totalSpent: BigNumber,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  const isTokenTransaction = Boolean(a && isTokenAccount(a));

  // if no amount or 0
  if (!t.amount || t.amount.isZero()) {
    errors.amount = new AmountRequired(); // "Amount required"
  } else if (totalSpent.isGreaterThan(isTokenTransaction ? a.spendableBalance : a.balance)) {
    // if not enough to make the transaction
    errors.amount = new NotEnoughBalance(); // "Sorry, insufficient funds"
  }

  if (isTokenTransaction) {
    warnings.amount = new TonExcessFee();
  }
  return [errors, warnings];
};

const validateComment = (t: Transaction): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};

  // if the comment isn't encrypted, it should be valid
  if (t.comment.isEncrypted || !commentIsValid(t.comment)) {
    errors.comment = new TonCommentInvalid();
  }
  return [errors];
};

export const getTransactionStatus = async (
  a: Account,
  t: Transaction,
): Promise<TransactionStatus> => {
  const subAccount = findSubAccountById(a, t.subAccountId ?? "");
  const tokenTransfer = Boolean(subAccount && isTokenAccount(subAccount));
  const totalSpent = tokenTransfer ? t.amount : t.amount.plus(t.fees);
  // let amount = t.useAllAmount ? isTokenTransaction ? ;

  // Recipient related errors and warnings
  const [recipientErr] = validateRecipient(a, t);
  // Sender related errors and warnings
  const [senderErr] = validateSender(a);
  // Amount related errors and warnings
  const [amountErr, amountWarn] = validateAmount(subAccount || a, t, totalSpent);
  // Comment related errors and warnings
  const [commentErr] = validateComment(t);

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
    amount: t.amount,
    errors,
    warnings,
    estimatedFees: t.fees,
    totalSpent,
  };
};

export default getTransactionStatus;
