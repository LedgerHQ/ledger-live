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
  findBestRecordForFee,
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
  const { amountRecordCommitment } = transaction.properties;
  const amountRecord = getValidRecord({ account, commitment: amountRecordCommitment });

  if (!amountRecord) {
    errors.amountRecord = new AleoAmountRecordRequired();
  } else if (amount.gt(new BigNumber(amountRecord.microcredits))) {
    errors.amount = new NotEnoughBalance();
  }

  const feeRecordError = validateFeeRecordStatus({
    account,
    transaction,
    estimatedFees,
    isFeeSponsored,
  });

  if (feeRecordError) {
    errors.feeRecord = feeRecordError;
  }

  return errors;
}

function validateFeeRecordStatus({
  account,
  transaction,
  estimatedFees,
  isFeeSponsored,
}: {
  account: AleoAccount;
  transaction: TransactionPrivate;
  estimatedFees: BigNumber;
  isFeeSponsored: boolean;
}): Error | null {
  if (isFeeSponsored) {
    return null;
  }

  const availableRecords = (account.aleoResources?.unspentPrivateRecords ?? []).filter(record =>
    new BigNumber(record.microcredits).isGreaterThan(0),
  );

  if (availableRecords.length <= 1) {
    return new AleoTwoRecordsRequired();
  }

  const bestFeeRecord = findBestRecordForFee({
    unspentRecords: availableRecords,
    selectedAmountRecordCommitment: transaction.properties.amountRecordCommitment ?? null,
    targetFee: estimatedFees,
  });

  if (!bestFeeRecord) {
    return new AleoFeeRecordInsufficientBalance();
  }

  if (!transaction.properties.amountRecordCommitment) {
    return null;
  }

  const feeRecordCommitment = transaction.properties.feeRecordCommitment;
  const feeRecord = feeRecordCommitment
    ? getRecordByCommitment({ account, commitment: feeRecordCommitment })
    : null;

  if (
    !feeRecord ||
    feeRecord.commitment === transaction.properties.amountRecordCommitment ||
    new BigNumber(feeRecord.microcredits).lt(estimatedFees)
  ) {
    return new AleoFeeRecordRequired();
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
