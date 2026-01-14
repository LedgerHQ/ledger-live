import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { craftTransaction, estimateFees, getNextValidSequence } from "../common-logic";
import { Transaction } from "../types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const seq = await getNextValidSequence(account.freshAddress, account.currency);

  const { serializedTransaction } = await craftTransaction(
    { address: account.freshAddress, nextSequenceNumber: seq },
    { amount: transaction.amount, recipient: transaction.recipient },
  );

  const estimation = await estimateFees(serializedTransaction, account.currency);

  if (!transaction.fee || !transaction.fee.isEqualTo(new BigNumber(estimation.cost.toString()))) {
    return { ...transaction, fee: new BigNumber(estimation.cost.toString()) };
  }

  return transaction;
};
