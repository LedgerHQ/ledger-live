import type { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  AmountRequired,
  RecipientRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import type {
  AleoAccount,
  Transaction as AleoTransaction,
  TransactionPrivate,
  TransactionStatus as AleoTransactionStatus,
  TransactionSelfTransfer,
  TransactionTransfer,
} from "../types";
import { estimateFees, validateAddress } from "../logic";
import {
  calculateAmount,
  getAvailableBalance,
  getRecordByCommitment,
  isPrivateTransaction,
  isSelfTransferTransaction,
} from "../logic/utils";
import aleoCoinConfig from "../config";
import { AleoAmountRecordRequired, AleoFeeRecordRequired } from "../errors";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

function validateRecord({
  account,
  commitment,
  error,
}: {
  account: AleoAccount;
  commitment: TransactionPrivate["properties"]["amountRecordCommitment"];
  error: Error;
}): Error | null {
  if (!commitment || !getRecordByCommitment({ account, commitment })) {
    return error;
  }

  return null;
}

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
  account: AleoAccount;
  transaction: TransactionSelfTransfer | TransactionTransfer;
  allowSelfTransfer: boolean;
}): Promise<AleoTransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const availableBalance = getAvailableBalance(account, transaction);
  const config = aleoCoinConfig.getCoinConfig(account.currency);
  const feeEstimation = estimateFees({
    configOrCurrencyId: config,
    transactionType: transaction.mode,
  });
  const estimatedFees = new BigNumber(feeEstimation.value.toString());
  const calculatedAmount = calculateAmount({
    transaction,
    account,
    estimatedFees,
  });

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

  if (isPrivateTransaction(transaction)) {
    const amountRecordError = validateRecord({
      account,
      commitment: transaction.properties.amountRecordCommitment,
      error: new AleoAmountRecordRequired(),
    });
    if (amountRecordError) {
      errors.amountRecord = amountRecordError;
    }

    if (!config.isFeeSponsored) {
      const feeRecordError = validateRecord({
        account,
        commitment: transaction.properties.feeRecordCommitment,
        error: new AleoFeeRecordRequired(),
      });
      if (feeRecordError) {
        errors.feeRecord = feeRecordError;
      }
    }
  }

  if (availableBalance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance();
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
  AleoAccount,
  AleoTransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const allowSelfTransfer = isSelfTransferTransaction(transaction);

  return handleTransferTransaction({
    account,
    transaction,
    allowSelfTransfer,
  });
};
