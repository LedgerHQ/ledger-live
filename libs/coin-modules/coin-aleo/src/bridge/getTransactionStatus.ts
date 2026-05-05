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
  AleoCoinConfig,
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
import { MAX_PRIVATE_RECORDS_PER_TRANSACTION } from "../constants";
import {
  AleoAmountRecordRequired,
  AleoAmountTooLargeForTransaction,
  AleoFeeRecordInsufficientBalance,
  AleoFeeRecordRequired,
  AleoTooManyRecordsSelected,
  AleoTwoRecordsRequired,
} from "../errors";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

function getValidRecord({
  account,
  commitment,
}: {
  account: AleoAccount;
  commitment: string | null;
}) {
  if (!commitment) {
    return null;
  }

  return getRecordByCommitment({ account, commitment });
}

/**
 * Returns the appropriate error when auto-picking selected no records, possible reasons are:
 * - no private balance (no records)
 * - insufficient balance to cover given amount
 * - more than MAX_PRIVATE_RECORDS_PER_TRANSACTION records would be needed to cover the amount
 */
function resolveAutoPickingAmountError(amount: BigNumber, privateBalance: BigNumber): Error {
  if (privateBalance.isZero() || amount.gt(privateBalance)) {
    return new NotEnoughBalance();
  }

  return new AleoAmountTooLargeForTransaction();
}

/**
 * Validation rules with fee sponsorship:
 *  - amount record must be valid and have sufficient balance to cover amount
 *  - fee record can be ignored as fees are not paid by the user
 * Validation rules without fee sponsorship:
 *  - amount record must be valid and have sufficient balance to cover amount
 *  - fee record must be valid, different from the amount record and have sufficient balance to cover fees
 */
function validatePrivateTransaction({
  account,
  transaction,
  amount,
  estimatedFees,
  config,
}: {
  account: AleoAccount;
  transaction: TransactionPrivate;
  amount: BigNumber;
  estimatedFees: BigNumber;
  config: AleoCoinConfig;
}): Errors {
  const errors: Errors = {};
  const { feeRecordCommitment, amountRecordCommitments } = transaction.properties;
  const amountRecords = amountRecordCommitments
    .map(commitment => getValidRecord({ account, commitment }))
    .filter((record): record is NonNullable<typeof record> => !!record);

  const totalAmountRecordsValue = amountRecords.reduce(
    (sum, record) => sum.plus(new BigNumber(record.microcredits)),
    new BigNumber(0),
  );

  const privateBalance = account.aleoResources?.privateBalance ?? new BigNumber(0);
  const hasSelectedRecord = amountRecords.length > 0;

  if (config.recordPickingStrategy === "manual" && !hasSelectedRecord) {
    errors.amountRecord = new AleoAmountRecordRequired();
  } else if (config.recordPickingStrategy === "auto" && !hasSelectedRecord) {
    errors.amount = resolveAutoPickingAmountError(amount, privateBalance);
  } else if (amountRecords.length > MAX_PRIVATE_RECORDS_PER_TRANSACTION) {
    errors.amount = new AleoTooManyRecordsSelected(undefined, {
      count: MAX_PRIVATE_RECORDS_PER_TRANSACTION,
    });
  } else if (amount.gt(totalAmountRecordsValue)) {
    errors.amount = new NotEnoughBalance();
  }

  if (config.isFeeSponsored) {
    return errors;
  }

  const feeRecord = getValidRecord({ account, commitment: feeRecordCommitment });
  const availableRecords = (account.aleoResources?.unspentPrivateRecords ?? []).filter(record =>
    new BigNumber(record.microcredits).isGreaterThan(0),
  );

  if (availableRecords.length <= 1) {
    errors.feeRecord = new AleoTwoRecordsRequired();
  } else if (!feeRecord || amountRecordCommitments.includes(feeRecord.commitment)) {
    errors.feeRecord = new AleoFeeRecordRequired();
  } else if (estimatedFees.gt(new BigNumber(feeRecord.microcredits))) {
    errors.feeRecord = new AleoFeeRecordInsufficientBalance();
  }

  return errors;
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
  const config = aleoCoinConfig.getCoinConfig(account.currency.id);
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
    Object.assign(
      errors,
      validatePrivateTransaction({
        account,
        transaction,
        amount: calculatedAmount.amount,
        estimatedFees,
        config,
      }),
    );
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
