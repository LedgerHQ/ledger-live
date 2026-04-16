import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees } from "../logic";
import { Transaction } from "../types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const fee = await estimateFees(
    account.freshAddress,
    transaction.recipient || account.freshAddress,
  );

  if (!transaction.fee || !transaction.fee.eq(fee)) {
    return { ...transaction, fee: new BigNumber(fee) };
  }

  return transaction;
};
