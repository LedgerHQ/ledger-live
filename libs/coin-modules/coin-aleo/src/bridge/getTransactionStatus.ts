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
import {
  AleoAmountRecordRequired,
  AleoFeeRecordInsufficientBalance,
  AleoFeeRecordRequired,
  AleoTwoRecordsRequired,
} from "../errors";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

function getValidRecord({
  account,
  commitment,
}: {
  account: AleoAccount;
  commitment: TransactionPrivate["properties"]["amountRecordCommitment"];
}) {
  if (!commitment) {
    return null;
  }

  return getRecordByCommitment({ account, commitment });
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
  isFeeSponsored,
}: {
  account: AleoAccount;
  transaction: TransactionPrivate;
  amount: BigNumber;
  estimatedFees: BigNumber;
  isFeeSponsored: boolean;
}): Errors {
  const errors: Errors = {};
  const { amountRecordCommitment, feeRecordCommitment } = transaction.properties;
  const amountRecordCommitments = transaction.properties.amountRecordCommitments?.length
    ? transaction.properties.amountRecordCommitments
    : amountRecordCommitment
      ? [amountRecordCommitment]
      : [];
  const amountRecords = amountRecordCommitments
    .map(commitment => getValidRecord({ account, commitment }))
    .filter((record): record is NonNullable<ReturnType<typeof getValidRecord>> => !!record);
  const selectedAmountBalance = amountRecords.reduce(
    (sum, record) => sum.plus(new BigNumber(record.microcredits)),
    new BigNumber(0),
  );

  if (amountRecords.length === 0) {
    errors.amountRecord = new AleoAmountRecordRequired();
  } else if (amount.gt(selectedAmountBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (isFeeSponsored) {
    return errors;
  }

  const feeRecord = getValidRecord({ account, commitment: feeRecordCommitment });
  const availableRecords = (account.aleoResources?.unspentPrivateRecords ?? []).filter(record =>
    new BigNumber(record.microcredits).isGreaterThan(0),
  );

  if (availableRecords.length <= 1) {
    errors.feeRecord = new AleoTwoRecordsRequired();
  } else if (
    !feeRecord ||
    amountRecordCommitments.includes(feeRecord.commitment) ||
    feeRecord.commitment === amountRecordCommitment
  ) {
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
        isFeeSponsored: config.isFeeSponsored,
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
