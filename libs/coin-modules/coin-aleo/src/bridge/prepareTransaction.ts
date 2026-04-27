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
    const selectedAmountRecords = selectPrivateRecordsForAmount({
      unspentRecords: unspentPrivateRecords,
      targetAmount: transaction.useAllAmount ? null : transaction.amount,
    });
    // MOCKED LOGIC, SHOLD BE REPLACED WITH PROPER ALGORITHM TO SELECT BEST RECORDS BASED ON THE TRANSACTION CONTEXT
    // const selectedAmountRecords = [...unspentPrivateRecords]
    //   .sort((a, b) => new BigNumber(b.microcredits).minus(new BigNumber(a.microcredits)).toNumber())
    //   .slice(0, 2);

    const selectedAmountRecordCommitments = selectedAmountRecords.map(record => record.commitment);

    const nextFeeRecordCommitment = !config.isFeeSponsored
      ? findBestRecordForFee({
          unspentRecords: unspentPrivateRecords,
          selectedAmountRecordCommitments,
          targetFee: estimatedFees,
        })?.commitment ?? transaction.properties.feeRecordCommitment
      : transaction.properties.feeRecordCommitment;

    const transactionWithAutoSelectedRecords = updateTransaction(transaction, {
      properties: {
        ...transaction.properties,
        amountRecordCommitments: selectedAmountRecordCommitments,
        feeRecordCommitment: nextFeeRecordCommitment,
      },
    });

    const calculatedAmount = calculateAmount({
      transaction: transactionWithAutoSelectedRecords,
      account,
      estimatedFees,
    });

    console.log("DEBUG", transactionWithAutoSelectedRecords);
    console.log("DEBUG", selectedAmountRecords);

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
