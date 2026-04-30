import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import aleoCoinConfig from "../config";
import { estimateFees } from "../logic";
import {
  calculateAmount,
  findBestRecordForFee,
  isPrivateTransaction,
  selectPrivateRecordsForAmount,
} from "../logic/utils";
import type {
  AleoAccount,
  AleoCoinConfig,
  Transaction as AleoTransaction,
  TransactionPrivate as AleoTransactionPrivate,
  AleoUnspentRecord,
} from "../types";

function getAmountRecordCommitments({
  transaction,
  config,
  unspentRecords,
}: {
  transaction: AleoTransactionPrivate;
  config: AleoCoinConfig;
  unspentRecords: AleoUnspentRecord[];
}): string[] {
  if (config.recordPickingStrategy === "manual") {
    return transaction.properties.amountRecordCommitments;
  }

  const targetAmount = transaction.useAllAmount ? null : transaction.amount;
  const selectedAmountRecords = selectPrivateRecordsForAmount({ unspentRecords, targetAmount });
  const selectedAmountRecordCommitments = selectedAmountRecords.map(record => record.commitment);

  return selectedAmountRecordCommitments;
}

export const prepareTransaction: AccountBridge<
  AleoTransaction,
  AleoAccount
>["prepareTransaction"] = async (account, transaction) => {
  const config = aleoCoinConfig.getCoinConfig(account.currency.id);
  const feeEstimation = estimateFees({
    configOrCurrencyId: config,
    transactionType: transaction.mode,
  });

  const estimatedFees = new BigNumber(feeEstimation.value.toString());

  // public transactions don't use records - amount and fees are resolved directly.
  if (!isPrivateTransaction(transaction)) {
    const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

    return updateTransaction(transaction, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
    });
  }

  const unspentRecords = account.aleoResources?.unspentPrivateRecords ?? [];
  const newAmountRecordCommitments = getAmountRecordCommitments({
    transaction,
    config,
    unspentRecords,
  });
  const privateTransactionWithRecords = updateTransaction(transaction, {
    properties: {
      ...transaction.properties,
      amountRecordCommitments: newAmountRecordCommitments,
    },
  });
  const calculatedAmount = calculateAmount({
    transaction: privateTransactionWithRecords,
    account,
    estimatedFees,
  });

  // when fee sponsorship is off, pick the smallest record that covers the fee
  let selectedFeeRecordCommitment: string | null = null;

  if (!config.isFeeSponsored && newAmountRecordCommitments.length > 0) {
    const feeRecord = findBestRecordForFee({
      unspentRecords,
      selectedAmountRecordCommitments: newAmountRecordCommitments,
      targetFee: estimatedFees,
    });

    selectedFeeRecordCommitment =
      feeRecord?.commitment ?? privateTransactionWithRecords.properties.feeRecordCommitment;
  }

  return updateTransaction(privateTransactionWithRecords, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
    properties: {
      ...privateTransactionWithRecords.properties,
      feeRecordCommitment: config.isFeeSponsored ? null : selectedFeeRecordCommitment,
    },
  });
};
