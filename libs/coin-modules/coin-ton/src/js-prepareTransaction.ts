import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { Transaction } from "./types";
import { getAddress, getTonEstimatedFees, transactionToHwParams } from "./utils";

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const accountInfo = await fetchAccountInfo(getAddress(a).address);
  const fees = await getTonEstimatedFees(
    a,
    accountInfo.status === "uninit",
    transactionToHwParams(t, accountInfo.seqno),
  );
  const amount = t.useAllAmount ? a.spendableBalance.minus(t.fees) : t.amount;
  return defaultUpdateTransaction(t, { fees, amount });
};

export default prepareTransaction;
