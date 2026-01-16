import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees } from "../common-logic";
import { Transaction } from "../types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const estimation = await estimateFees("", account.currency);

  if (!transaction.fee || !transaction.fee.isEqualTo(new BigNumber(estimation.cost.toString()))) {
    return { ...transaction, fee: new BigNumber(estimation.cost.toString()) };
  }

  return transaction;
};
