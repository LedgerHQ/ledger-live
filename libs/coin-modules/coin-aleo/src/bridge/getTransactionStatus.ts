import type { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  AmountRequired,
  RecipientRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import type {
  Transaction as AleoTransaction,
  TransactionStatus as AleoTransactionStatus,
  TransactionSelfTransfer,
  TransactionStatus,
  TransactionTransfer,
} from "../types";
import { estimateFees, validateAddress } from "../logic";
import { calculateAmount, isSelfTransferTransaction, isTransferTransaction } from "../logic/utils";
import aleoCoinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

async function validateRecipient({
  account,
  recipient,
  allowSelfTransfer,
}: {
  account: Account;
  recipient: string;
  allowSelfTransfer: boolean;
}): Promise<Error | null> {
  if (!recipient || recipient.length === 0) {
    return new RecipientRequired();
  }

  const isValidRecipient = await validateAddress(recipient, {});
  const currencyName = account.currency.name;

  if (!isValidRecipient) {
    return new InvalidAddress("", { currencyName });
  }

  if (!allowSelfTransfer && account.freshAddress === recipient) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return null;
}

async function handleTransferTransaction({
  account,
  transaction,
  allowSelfTransfer,
}: {
  account: Account;
  transaction: TransactionTransfer | TransactionSelfTransfer;
  allowSelfTransfer: boolean;
}): Promise<TransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const config = aleoCoinConfig.getCoinConfig(account.currency);
  const estimatedFees = await estimateFees({
    feesByTransactionType: config.feesByTransactionType,
    transactionType: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    estimatedFeeSafetyRate: config.estimatedFeeSafetyRate,
  });
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  const recipientError = await validateRecipient({
    account,
    recipient: transaction.recipient,
    allowSelfTransfer,
  });

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (transaction.amount.eq(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (account.balance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance("");
  }

  // FIXME: custom errors probably
  if (
    transaction.type === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    transaction.type === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  ) {
    if (!transaction.amountRecord) {
      errors.amountRecord = new Error("Amount record is required for private transactions");
    }

    if (!transaction.feeRecord) {
      errors.feeRecord = new Error("Fee record is required for private transactions");
    }
  }

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees,
    errors,
    warnings,
  };
}

export const getTransactionStatus: AccountBridge<
  AleoTransaction,
  Account,
  AleoTransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  if (isTransferTransaction(transaction)) {
    return handleTransferTransaction({
      account,
      transaction,
      allowSelfTransfer: false,
    });
  } else if (isSelfTransferTransaction(transaction)) {
    return handleTransferTransaction({
      account,
      transaction,
      allowSelfTransfer: true,
    });
  }

  // @ts-expect-error - FIXME:
  throw new Error(`aleo: unsupported transaction type in getTransactionStatus ${transaction.type}`);
};
