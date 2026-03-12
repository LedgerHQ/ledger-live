import type { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction } from "../types";
import { estimateFees } from "../logic";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const estimation = await estimateFees(account.currency.id, transaction.memo);

  if (!transaction.fee?.isEqualTo(new BigNumber(estimation.cost.toString()))) {
    return { ...transaction, fee: new BigNumber(estimation.cost.toString()) };
  }

  return transaction;
};
