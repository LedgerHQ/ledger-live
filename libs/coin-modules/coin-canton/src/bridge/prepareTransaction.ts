import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { estimateFees } from "../common-logic";
import BigNumber from "bignumber.js";
import { updateTransaction } from "./updateTransaction";
import coinConfig from "../config";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const amount = transaction.amount || BigNumber(0);
  const fee = BigNumber(
    (await estimateFees(account.currency, BigInt(amount.toFixed()))).toString(),
  );

  if (!transaction.tokenId) {
    transaction.tokenId = coinConfig.getCoinConfig(account.currency).nativeInstrumentId;
  }
  return updateTransaction(transaction, { fee });
};
