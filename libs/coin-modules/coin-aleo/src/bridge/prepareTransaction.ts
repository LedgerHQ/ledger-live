import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import aleoCoinConfig from "../config";
import { estimateFees } from "../logic";
import { calculateAmount } from "../logic/utils";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";

export const prepareTransaction: AccountBridge<
  AleoTransaction,
  AleoAccount
>["prepareTransaction"] = async (account, transaction) => {
  const config = aleoCoinConfig.getCoinConfig(account.currency);
  const feeEstimation = estimateFees({
    configOrCurrencyId: config,
    transactionType: transaction.type,
  });

  const estimatedFees = new BigNumber(feeEstimation.value.toString());
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
  });
};
