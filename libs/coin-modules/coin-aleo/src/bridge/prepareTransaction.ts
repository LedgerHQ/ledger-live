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
  const config = aleoCoinConfig.getCoinConfig(account.currency);
  const feeEstimation = estimateFees({
    configOrCurrencyId: config,
    transactionType: transaction.mode,
  });

  const estimatedFees = new BigNumber(feeEstimation.value.toString());
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  // find and update fee record only for private transactions with non-sponsored fees
  // this is done here instead of signOperation to enable getTransactionStatus validation
  if (
    isPrivateTransaction(transaction) &&
    !config.isFeeSponsored &&
    transaction.properties.amountRecordCommitment
  ) {
    const feeRecord = findBestRecordForFee({
      unspentRecords: account.aleoResources?.unspentPrivateRecords ?? [],
      selectedAmountRecordCommitment: transaction.properties.amountRecordCommitment,
      targetFee: estimatedFees,
    });

    console.log("*** prepareTransaction - updating fee record", {
      account,
      transaction,
      calculatedAmount,
      estimatedFees,
      feeRecord,
    });

    return updateTransaction(transaction, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
      properties: {
        ...transaction.properties,
        feeRecordCommitment: feeRecord?.commitment ?? null,
      },
    });
  }

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
  });
};
