import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { craftTransaction, estimateFees } from "../logic";
import { getNextSequence } from "../network/node";
import { Transaction } from "../types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const seq = await getNextSequence(account.freshAddress);

  const craftedTransaction = await craftTransaction(
    { address: account.freshAddress, nextSequenceNumber: seq },
    { amount: transaction.amount, recipient: transaction.recipient },
  );

  const fee = await estimateFees(craftedTransaction.serializedTransaction);

  if (transaction.fee !== new BigNumber(fee.toString())) {
    return { ...transaction, fee: new BigNumber(fee.toString()) };
  }

  return transaction;
};
