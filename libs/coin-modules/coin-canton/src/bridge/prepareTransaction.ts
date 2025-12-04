import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees } from "../common-logic";
import coinConfig from "../config";
import { Transaction } from "../types";
import { updateTransaction } from "./updateTransaction";

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
