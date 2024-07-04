import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { Transaction } from "./types";
import { buildTonTransaction, getTonEstimatedFees } from "./utils";

const prepareTransaction: AccountBridge<Transaction, Account>["prepareTransaction"] = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  const accountInfo = await fetchAccountInfo(account.freshAddress);

  const simpleTx = buildTonTransaction(transaction, accountInfo.seqno);

  const fees = await getTonEstimatedFees(account, accountInfo.status === "uninit", simpleTx);

  let amount;
  if (transaction.useAllAmount) {
    amount = account.spendableBalance.minus(fees);
  } else {
    amount = transaction.amount;
  }

  return defaultUpdateTransaction(transaction, { fees, amount });
};

export default prepareTransaction;
