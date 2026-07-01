import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import aleoCoinConfig from "../config";
import { MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION, TRANSACTION_TYPE } from "../constants";
import { estimateFees } from "../logic";
import {
  calculateAmount,
  derivePrivateTransactionMode,
  derivePublicTransactionMode,
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
  if (config.isFeeSponsored) {
    return null;
  }

  // fees are always paid with native ALEO credits
  // selected amount record commitments should be empty with token transactions
  const selectedAmountRecordCommitments = isTokenTx ? [] : amountRecordCommitments;

  const feeRecord = findBestRecordForFee({
    unspentRecords: feeRecordPool,
    selectedAmountRecordCommitments,
    targetFee: estimatedFees,
  });

  return feeRecord?.commitment ?? existingFeeRecordCommitment;
}

function preparePublicTransaction({
  account,
  transaction,
  derivedTransactionMode,
  estimatedFees,
  isSelfTransfer,
}: {
  account: AleoAccount;
  transaction: AleoTransaction;
  derivedTransactionMode: AleoTransaction["mode"];
  estimatedFees: BigNumber;
  isSelfTransfer: boolean;
}): AleoTransaction {
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
    mode: derivedTransactionMode,
    ...(isSelfTransfer && { recipient: account.freshAddress }),
  });
}

function preparePrivateTransaction({
  account,
  transaction,
  derivedTransactionMode,
  config,
  estimatedFees,
  subAccount,
  isTokenTx,
  isSelfTransfer,
}: {
  account: AleoAccount;
  transaction: AleoTransactionPrivate;
  derivedTransactionMode: AleoTransactionPrivate["mode"];
  config: AleoCoinConfig;
  estimatedFees: BigNumber;
  subAccount: AleoTokenAccount | undefined;
  isTokenTx: boolean;
  isSelfTransfer: boolean;
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

  return updateTransaction(transactionWithRecords, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
    mode: derivedTransactionMode,
    properties: {
      ...transactionWithRecords.properties,
      feeRecordCommitment,
    },
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
  const isTokenTx = !!subAccount;

  if (transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC) {
    const feeEstimation = estimateFees({
      configOrCurrencyId: config,
      transactionType: TRANSACTION_TYPE.BOND_PUBLIC,
    });
    const estimatedFees = new BigNumber(feeEstimation.value.toString());
    const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

    return updateTransaction(transaction, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
      withdrawal: transaction.withdrawal || account.freshAddress,
    });
  }

  if (transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC) {
    const feeEstimation = estimateFees({
      configOrCurrencyId: config,
      transactionType: TRANSACTION_TYPE.UNBOND_PUBLIC,
    });
    const estimatedFees = new BigNumber(feeEstimation.value.toString());
    const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

    return updateTransaction(transaction, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
    });
  }

  if (transaction.mode === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC) {
    const feeEstimation = estimateFees({
      configOrCurrencyId: config,
      transactionType: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC,
    });
    const estimatedFees = new BigNumber(feeEstimation.value.toString());

    return updateTransaction(transaction, {
      amount: new BigNumber(0),
      fees: estimatedFees,
    });
  }

  if (isPrivateTransaction(transaction)) {
    const derivedTransactionMode = derivePrivateTransactionMode({ isTokenTx, isSelfTransfer });
    const feeEstimation = estimateFees({
      configOrCurrencyId: config,
      transactionType: derivedTransactionMode,
    });
    const estimatedFees = new BigNumber(feeEstimation.value.toString());

    return preparePrivateTransaction({
      account,
      transaction,
      derivedTransactionMode,
      config,
      estimatedFees,
      subAccount,
      isTokenTx,
      isSelfTransfer,
    });
  }

  const derivedTransactionMode = derivePublicTransactionMode({ isTokenTx, isSelfTransfer });
  const feeEstimation = estimateFees({
    configOrCurrencyId: config,
    transactionType: derivedTransactionMode,
  });
  const estimatedFees = new BigNumber(feeEstimation.value.toString());

  return preparePublicTransaction({
    account,
    transaction,
    derivedTransactionMode,
    estimatedFees,
    isSelfTransfer,
  });
};
