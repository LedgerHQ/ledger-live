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
import type { AleoAccount, AleoUnspentRecord, Transaction as AleoTransaction } from "../types";

function resolveAmountRecord(
  transaction: AleoTransaction,
  unspentPrivateRecords: AleoUnspentRecord[],
  strategy: "manual" | "auto",
): AleoTransaction {
  if (!isPrivateTransaction(transaction) || strategy !== "auto") {
    return transaction;
  }
  const selectedRecords = selectPrivateRecordsForAmount({
    unspentRecords: unspentPrivateRecords,
    targetAmount: transaction.useAllAmount ? null : transaction.amount,
  });
  return updateTransaction(transaction, {
    properties: {
      ...transaction.properties,
      amountRecordCommitment: selectedRecords[0]?.commitment ?? null,
    },
  });
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
  const unspentPrivateRecords = account.aleoResources?.unspentPrivateRecords ?? [];

  const transactionWithAmountRecord = resolveAmountRecord(
    transaction,
    unspentPrivateRecords,
    config.recordPickingStrategy,
  );

  const calculatedAmount = calculateAmount({
    transaction: transactionWithAmountRecord,
    account,
    estimatedFees,
  });

  if (
    isPrivateTransaction(transactionWithAmountRecord) &&
    !config.isFeeSponsored &&
    transactionWithAmountRecord.properties.amountRecordCommitment
  ) {
    const nextFeeRecordCommitment =
      findBestRecordForFee({
        unspentRecords: unspentPrivateRecords,
        selectedAmountRecordCommitment:
          transactionWithAmountRecord.properties.amountRecordCommitment,
        targetFee: estimatedFees,
      })?.commitment ?? transactionWithAmountRecord.properties.feeRecordCommitment;

    return updateTransaction(transactionWithAmountRecord, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
      properties: {
        ...transactionWithAmountRecord.properties,
        ...(nextFeeRecordCommitment && { feeRecordCommitment: nextFeeRecordCommitment }),
      },
    });
  }

  return updateTransaction(transactionWithAmountRecord, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
  });
};
