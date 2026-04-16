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
  selectTopPrivateRecordsByValue,
} from "../logic/utils";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";

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

  if (isPrivateTransaction(transaction)) {
    const selectedAmountRecords = transaction.useAllAmount
      ? selectTopPrivateRecordsByValue({ unspentRecords: unspentPrivateRecords })
      : selectPrivateRecordsForAmount({
          unspentRecords: unspentPrivateRecords,
          targetAmount: transaction.amount,
        });

    const selectedAmountRecordCommitments = selectedAmountRecords.map(record => record.commitment);
    const selectedPrimaryCommitment = selectedAmountRecordCommitments[0] ?? null;

    const nextFeeRecordCommitment = !config.isFeeSponsored
      ? findBestRecordForFee({
          unspentRecords: unspentPrivateRecords,
          selectedAmountRecordCommitment: selectedPrimaryCommitment,
          selectedAmountRecordCommitments: selectedAmountRecordCommitments,
          targetFee: estimatedFees,
        })?.commitment ?? transaction.properties.feeRecordCommitment
      : transaction.properties.feeRecordCommitment;

    const transactionWithAutoSelectedRecords = updateTransaction(transaction, {
      properties: {
        ...transaction.properties,
        amountRecordCommitment: selectedPrimaryCommitment,
        amountRecordCommitments: selectedAmountRecordCommitments,
        feeRecordCommitment: nextFeeRecordCommitment,
      },
    });

    const calculatedAmount = calculateAmount({
      transaction: transactionWithAutoSelectedRecords,
      account,
      estimatedFees,
    });

    return updateTransaction(transactionWithAutoSelectedRecords, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
    });
  }

  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
  });
};
