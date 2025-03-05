import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { craftTransaction, estimateFees } from "../common-logic";
import { getNextSequence } from "../network/node";
import BigNumber from "bignumber.js";
import { Intent } from "@ledgerhq/coin-framework/lib/api/types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const seq = await getNextSequence(account.freshAddress);

  const craftedTransaction = await craftTransaction(
    { address: account.freshAddress, nextSequenceNumber: seq },
    { amount: transaction.amount, recipient: transaction.recipient },
  );

  const fee = await estimateFees({} as Intent);

  if (transaction.fee !== new BigNumber(fee.standard.toString())) {
    return { ...transaction, fee: new BigNumber(fee.standard.toString()) };
  }

  return transaction;
};
