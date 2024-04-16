import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { Transaction } from "./types";
import { getAddress, getSubAccount, getTonEstimatedFees, transactionToHwParams } from "./utils";

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const accountInfo = await fetchAccountInfo(getAddress(a).address);
  const fees = await getTonEstimatedFees(
    a,
    accountInfo.status === "uninit",
    transactionToHwParams(t, accountInfo.seqno),
  );
  const subAccount = getSubAccount(t, a);
  let amount;
  if (t.useAllAmount) {
    amount = subAccount ? subAccount.spendableBalance : a.spendableBalance.minus(t.fees);
  } else {
    amount = t.amount;
  }
  return defaultUpdateTransaction(t, { fees, amount });
};

export default prepareTransaction;
