import type { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  AmountRequired,
  RecipientRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type {
  Transaction as AleoTransaction,
  TransactionStatus as AleoTransactionStatus,
} from "../types";
import { estimateFees, validateAddress } from "../logic";
import { calculateAmount } from "../logic/utils";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

async function validateRecipient(account: Account, recipient: string): Promise<Error | null> {
  if (!recipient || recipient.length === 0) {
    return new RecipientRequired();
  }

  const isValidRecipient = await validateAddress(recipient, {});
  const currency = findCryptoCurrencyById("aleo");
  const currencyName = currency?.name ?? "Aleo";

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

  const estimatedFees = await estimateFees();
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
