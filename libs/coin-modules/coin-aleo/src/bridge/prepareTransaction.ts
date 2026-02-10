import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";
import { estimateFees } from "../logic";
import { calculateAmount, findBestRecords } from "../logic/utils";
import aleoCoinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";

export const prepareTransaction: AccountBridge<
  AleoTransaction,
  AleoAccount
>["prepareTransaction"] = async (account, transaction) => {
  const config = aleoCoinConfig.getCoinConfig(account.currency);
  const estimatedFees = await estimateFees({
    feesByTransactionType: config.feesByTransactionType,
    transactionType: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    estimatedFeeSafetyRate: config.estimatedFeeSafetyRate,
  });
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  if (
    transaction.type === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    transaction.type === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  ) {
    const { amountRecord, feeRecord } = findBestRecords({
      unspentRecords: account.aleoResources?.unspentPrivateRecords ?? [],
      targetAmount: calculatedAmount.totalSpent,
      targetFee: estimatedFees,
    });

    console.log("*** prepareTransaction - updating private", {
      account,
      transaction,
      calculatedAmount,
      estimatedFees,
      amountRecord,
      feeRecord,
    });

    return updateTransaction(transaction, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
      amountRecord: amountRecord?.plaintext ?? null,
      feeRecord: feeRecord?.plaintext ?? null,
    });
  }

  console.log("*** prepareTransaction - updating public", {
    account,
    transaction,
    calculatedAmount,
    estimatedFees,
  });

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
  });
};
