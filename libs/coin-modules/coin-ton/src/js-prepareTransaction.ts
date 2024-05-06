import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { Transaction } from "./types";
import { getAddress, getTonEstimatedFees, isJettonTransfer, transactionToHwParams } from "./utils";

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const accountInfo = await fetchAccountInfo(getAddress(a).address);

  const subAccount = findSubAccountById(a, t.subAccountId || "");
  const tokenTransfer = Boolean(subAccount && isTokenAccount(subAccount));

  const simpleTx = transactionToHwParams(t, accountInfo.seqno, a);
  if (tokenTransfer && simpleTx.payload && isJettonTransfer(simpleTx.payload)) {
    simpleTx.payload = undefined;
  }
  const fees = await getTonEstimatedFees(a, accountInfo.status === "uninit", simpleTx);

  let amount;
  if (t.useAllAmount) {
    amount = subAccount ? subAccount.spendableBalance : a.spendableBalance.minus(fees);
  } else {
    amount = t.amount;
  }
  return defaultUpdateTransaction(t, { fees, amount });
};

export default prepareTransaction;
