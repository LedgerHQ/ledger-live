import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import aleoCoinConfig from "../config";
import { estimateFees } from "../logic";
import { calculateAmount, findBestRecordForFee, isPrivateTransaction } from "../logic/utils";
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
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  if (
    isPrivateTransaction(transaction) &&
    !config.isFeeSponsored &&
    transaction.properties.amountRecordCommitments.length > 0
  ) {
    const feeRecord = findBestRecordForFee({
      unspentRecords: account.aleoResources?.unspentPrivateRecords ?? [],
      selectedAmountRecordCommitments: transaction.properties.amountRecordCommitments,
      targetFee: estimatedFees,
    });
    const nextFeeRecordCommitment =
      feeRecord?.commitment ?? transaction.properties.feeRecordCommitment;

    return updateTransaction(transaction, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
      properties: {
        ...transaction.properties,
        ...(nextFeeRecordCommitment && { feeRecordCommitment: nextFeeRecordCommitment }),
      },
    });
  }

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
  });
};
