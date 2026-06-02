import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import aleoCoinConfig from "../config";
import { estimateFees } from "../logic";
import {
  calculateAmount,
  findBestRecordForFee,
  isPrivateTransaction,
  isSelfTransferTransaction,
  selectPrivateRecordsForAmount,
  getAleoSubAccount,
} from "../logic/utils";
import type {
  AleoAccount,
  AleoCoinConfig,
  AleoTokenAccount,
  Transaction as AleoTransaction,
  TransactionPrivate as AleoTransactionPrivate,
  AleoUnspentRecord,
} from "../types";
import { MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION, TRANSACTION_TYPE } from "../constants";

function getAmountRecordCommitments({
  transaction,
  config,
  unspentRecords,
  maxRecords,
}: {
  transaction: AleoTransactionPrivate;
  config: AleoCoinConfig;
  unspentRecords: AleoUnspentRecord[];
  maxRecords?: number;
}): string[] {
  if (config.recordPickingStrategy === "manual") {
    return transaction.properties.amountRecordCommitments;
  }

  const targetAmount = transaction.useAllAmount ? null : transaction.amount;
  const selectedAmountRecords = selectPrivateRecordsForAmount({
    unspentRecords,
    targetAmount,
    ...(typeof maxRecords === "number" && { maxRecords }),
  });

  return selectedAmountRecords.map(record => record.commitment);
}

function resolveFeeRecordCommitment({
  config,
  amountRecordCommitments,
  feeRecordPool,
  isTokenTx,
  existingFeeRecordCommitment,
  estimatedFees,
}: {
  config: AleoCoinConfig;
  amountRecordCommitments: string[];
  feeRecordPool: AleoUnspentRecord[];
  isTokenTx: boolean;
  existingFeeRecordCommitment: string | null;
  estimatedFees: BigNumber;
}): string | null {
  if (config.isFeeSponsored || amountRecordCommitments.length === 0) {
    return config.isFeeSponsored ? null : existingFeeRecordCommitment;
  }

  const feeRecord = findBestRecordForFee({
    unspentRecords: feeRecordPool,
    // Token fees are paid from ALEO credits — separate pool from token amount records.
    selectedAmountRecordCommitments: isTokenTx ? [] : amountRecordCommitments,
    targetFee: estimatedFees,
  });

  return feeRecord?.commitment ?? existingFeeRecordCommitment;
}

function preparePublicTransaction({
  account,
  transaction,
  estimatedFees,
  isSelfTransfer,
  isTokenTx,
}: {
  account: AleoAccount;
  transaction: AleoTransaction;
  estimatedFees: BigNumber;
  isSelfTransfer: boolean;
  isTokenTx: boolean;
}): AleoTransaction {
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  if (isTokenTx) {
    return updateTransaction(transaction, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
      mode: isSelfTransfer
        ? TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE
        : TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
      ...(isSelfTransfer && { recipient: account.freshAddress }),
    });
  }

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
    mode: isSelfTransfer
      ? TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
      : TRANSACTION_TYPE.TRANSFER_PUBLIC,
    ...(isSelfTransfer && { recipient: account.freshAddress }),
  });
}

function preparePrivateTransaction({
  account,
  transaction,
  config,
  estimatedFees,
  subAccount,
  isSelfTransfer,
  isTokenTx,
}: {
  account: AleoAccount;
  transaction: AleoTransactionPrivate;
  config: AleoCoinConfig;
  estimatedFees: BigNumber;
  subAccount: AleoTokenAccount | undefined;
  isSelfTransfer: boolean;
  isTokenTx: boolean;
}): AleoTransaction {
  const amountRecordPool = isTokenTx
    ? (subAccount?.unspentPrivateRecords ?? [])
    : (account.aleoResources?.unspentPrivateRecords ?? []);

  const newAmountRecordCommitments = getAmountRecordCommitments({
    transaction,
    config,
    unspentRecords: amountRecordPool,
    ...(isTokenTx && { maxRecords: MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION }),
  });

  const transactionWithRecords = updateTransaction(transaction, {
    properties: {
      ...transaction.properties,
      amountRecordCommitments: newAmountRecordCommitments,
    },
  });

  const calculatedAmount = calculateAmount({
    transaction: transactionWithRecords,
    account,
    estimatedFees,
  });

  const feeRecordPool = isTokenTx
    ? (account.aleoResources?.unspentPrivateRecords ?? [])
    : amountRecordPool;

  const feeRecordCommitment = resolveFeeRecordCommitment({
    config,
    amountRecordCommitments: newAmountRecordCommitments,
    feeRecordPool,
    isTokenTx,
    existingFeeRecordCommitment: transactionWithRecords.properties.feeRecordCommitment,
    estimatedFees,
  });

  const preparedProperties = {
    ...transactionWithRecords.properties,
    feeRecordCommitment,
  };

  if (isTokenTx) {
    return updateTransaction(transactionWithRecords, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
      mode: isSelfTransfer
        ? TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC
        : TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      properties: preparedProperties,
      ...(isSelfTransfer && { recipient: account.freshAddress }),
    });
  }

  return updateTransaction(transactionWithRecords, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
    mode: isSelfTransfer
      ? TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
      : TRANSACTION_TYPE.TRANSFER_PRIVATE,
    properties: preparedProperties,
    ...(isSelfTransfer && { recipient: account.freshAddress }),
  });
}

export const prepareTransaction: AccountBridge<
  AleoTransaction,
  AleoAccount
>["prepareTransaction"] = async (account, transaction) => {
  const config = aleoCoinConfig.getCoinConfig(account.currency.id);
  const isSelfTransfer = isSelfTransferTransaction(transaction);
  const subAccount = getAleoSubAccount(account, transaction.subAccountId);
  const isTokenTx = Boolean(subAccount);
  const feeEstimation = estimateFees({
    configOrCurrencyId: config,
    transactionType: transaction.mode,
  });
  const estimatedFees = new BigNumber(feeEstimation.value.toString());

  if (isPrivateTransaction(transaction)) {
    return preparePrivateTransaction({
      account,
      transaction,
      config,
      estimatedFees,
      subAccount,
      isSelfTransfer,
      isTokenTx,
    });
  }

  return preparePublicTransaction({
    account,
    transaction,
    estimatedFees,
    isSelfTransfer,
    isTokenTx,
  });
};
