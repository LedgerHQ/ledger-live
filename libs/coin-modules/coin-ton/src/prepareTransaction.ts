import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { TonAccount, Transaction } from "./types";
import { buildTonTransaction, findSubAccountById, getTonEstimatedFees } from "./utils";

const prepareTransaction: AccountBridge<Transaction, TonAccount>["prepareTransaction"] = async (
  account: TonAccount,
  transaction: Transaction,
): Promise<Transaction> => {
  const accountInfo = await fetchAccountInfo(account.freshAddress);
  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");

  const simpleTx = buildTonTransaction(transaction, accountInfo.seqno, account);

  const fees = await getTonEstimatedFees(account, accountInfo.status === "uninit", simpleTx);

  let amount;
  if (transaction.useAllAmount) {
    amount = subAccount ? subAccount.spendableBalance : account.spendableBalance.minus(fees);
  } else {
    amount = transaction.amount;
  }

  return updateTransaction(transaction, { fees, amount });
};

export default prepareTransaction;
