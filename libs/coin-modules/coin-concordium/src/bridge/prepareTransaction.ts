import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { encodeMemoToCbor } from "@ledgerhq/hw-app-concordium/lib/cbor";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { Transaction } from "../types";
import { estimateFees } from "../logic";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const transactionType = transaction.memo
    ? TransactionType.TransferWithMemo
    : TransactionType.Transfer;

  const memoSize = transaction.memo ? encodeMemoToCbor(transaction.memo).length : undefined;

  const estimation = await estimateFees(account.currency, transactionType, memoSize);

  if (!transaction.fee?.isEqualTo(new BigNumber(estimation.cost.toString()))) {
    return { ...transaction, fee: new BigNumber(estimation.cost.toString()) };
  }

  return transaction;
};
