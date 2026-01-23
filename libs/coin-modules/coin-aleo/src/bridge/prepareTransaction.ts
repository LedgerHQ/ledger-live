import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction as AleoTransaction } from "../types";
import { estimateFees } from "../logic";
import { calculateAmount } from "../logic/utils";

export const prepareTransaction: AccountBridge<AleoTransaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const estimatedFees = await estimateFees();
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  return updateTransaction(transaction, {
    amount: calculatedAmount.amount,
    fees: estimatedFees,
  });
};
