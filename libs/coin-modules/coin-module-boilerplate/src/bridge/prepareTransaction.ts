import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getNextSequence } from "../network/node";
import { Transaction } from "../types";
import coinConfig from "../config";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const seq = await getNextSequence(coinConfig.getCoinConfig(), account.freshAddress);

  const craftedTransaction = await craftTransaction(
    { address: account.freshAddress, nextSequenceNumber: seq },
    { amount: transaction.amount, recipient: transaction.recipient },
  );

  const fee = await estimateFees(
    coinConfig.getCoinConfig(),
    craftedTransaction.serializedTransaction,
  );

  if (transaction.fee !== new BigNumber(fee.toString())) {
    return { ...transaction, fee: new BigNumber(fee.toString()) };
  }

  return transaction;
};
