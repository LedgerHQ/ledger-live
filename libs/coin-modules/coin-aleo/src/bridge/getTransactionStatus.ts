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
} from "../types";
import { estimateFees, validateAddress } from "../logic";
import { calculateAmount } from "../logic/utils";
import aleoCoinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

async function validateRecipient(account: Account, recipient: string): Promise<Error | null> {
  if (!recipient || recipient.length === 0) {
    return new RecipientRequired();
  }

  const isValidRecipient = await validateAddress(recipient, {});
  const currencyName = account.currency.name;

  if (!isValidRecipient) {
    return new InvalidAddress("", { currencyName });
  }

  if (account.freshAddress === recipient) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return null;
}

export const getTransactionStatus: AccountBridge<
  AleoTransaction,
  Account,
  AleoTransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const config = aleoCoinConfig.getCoinConfig(account.currency);
  const estimatedFees = await estimateFees({
    feesByTransactionType: config.feesByTransactionType,
    transactionType: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    estimatedFeeSafetyRate: config.estimatedFeeSafetyRate,
  });
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  const recipientError = await validateRecipient(account, transaction.recipient);

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (transaction.amount.eq(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (account.balance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance("");
  }

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees,
    errors,
    warnings,
  };
};
