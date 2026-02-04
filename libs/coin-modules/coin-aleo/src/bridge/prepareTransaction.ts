import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction as AleoTransaction } from "../types";
import { estimateFees } from "../logic";
import { calculateAmount } from "../logic/utils";
import aleoCoinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";

export const prepareTransaction: AccountBridge<AleoTransaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const config = aleoCoinConfig.getCoinConfig(account.currency);
  const estimatedFees = await estimateFees({
    feesByTransactionType: config.feesByTransactionType,
    transactionType: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    estimatedFeeSafetyRate: config.estimatedFeeSafetyRate,
  });
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
  });
};
