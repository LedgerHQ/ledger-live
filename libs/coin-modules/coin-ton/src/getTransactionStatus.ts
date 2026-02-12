import { isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import { toNano } from "@ton/core";
import BigNumber from "bignumber.js";
import { MINIMUM_REQUIRED_BALANCE, TOKEN_TRANSFER_MAX_FEE } from "./constants";
import {
  TonCommentInvalid,
  TonExcessFee,
  TonMinimumRequired,
  TonNotEnoughBalanceInParentAccount,
} from "./errors";
import { validateMemo } from "./logic/validateMemo";
import { TonAccount, Transaction, TransactionStatus } from "./types";
import { addressesAreEqual, findSubAccountById, isAddressValid } from "./utils";

type ValidatedTransactionFields = "recipient" | "sender" | "amount" | "transaction";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

/**
 * Validate an address for account transaction
 */
const validateRecipient = (account: TonAccount, tx: Transaction): Array<ValidationIssues> => {
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
const validateSender = (account: TonAccount): Array<ValidationIssues> => {
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
  account: TonAccount,
  transaction: Transaction,
  totalSpent: BigNumber,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const tokenTransfer = Boolean(subAccount && isTokenAccount(subAccount));

  // if no amount or 0
  if (!transaction.amount || transaction.amount.isZero()) {
    errors.amount = new AmountRequired(); // "Amount required"
  } else if (
    totalSpent.isGreaterThan(
      tokenTransfer && subAccount ? subAccount?.spendableBalance : account.balance,
    )
  ) {
    // if not enough to make the transaction
    errors.amount = new NotEnoughBalance(); // "Sorry, insufficient funds"
  }

  if (tokenTransfer) {
    if (account.balance.isLessThan(new BigNumber(toNano(TOKEN_TRANSFER_MAX_FEE).toString()))) {
      // if not enough for the fee to make the transaction
      errors.amount = new TonNotEnoughBalanceInParentAccount(); // "Sorry, insufficient funds in the parent account"
    }
    warnings.amount = new TonExcessFee();
  } else {
    if (account.balance.isLessThan(new BigNumber(toNano(MINIMUM_REQUIRED_BALANCE).toString()))) {
      errors.amount = new TonMinimumRequired();
    }
  }

  return [errors, warnings];
};

export const getTransactionStatus: AccountBridge<
  Transaction,
  TonAccount,
  TransactionStatus
>["getTransactionStatus"] = async (
  account: TonAccount,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const tokenTransfer = Boolean(subAccount && isTokenAccount(subAccount));
  const totalSpent = tokenTransfer ? transaction.amount : transaction.amount.plus(transaction.fees);

  // Recipient related errors and warnings
  const [recipientErr] = validateRecipient(account, transaction);
  // Sender related errors and warnings
  const [senderErr] = validateSender(account);
  // Amount related errors and warnings
  const [amountErr, amountWarn] = validateAmount(account, transaction, totalSpent);

  const errors: ValidationIssues = {
    ...recipientErr,
    ...senderErr,
    ...amountErr,
  };

  if (!validateMemo(transaction.comment)) {
    errors.transaction = new TonCommentInvalid();
  }

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
