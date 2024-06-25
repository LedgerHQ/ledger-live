import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { toNano } from "@ton/core";
import BigNumber from "bignumber.js";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import { MAX_FEE_TOKEN_TRANSFER } from "./constants";
import type { Transaction } from "./types";
import { buildTonTransaction, getTonEstimatedFees, isJettonTransfer } from "./utils";

const prepareTransaction: AccountBridge<Transaction, Account>["prepareTransaction"] = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  const accountInfo = await fetchAccountInfo(account.freshAddress);
  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const tokenTransfer = Boolean(subAccount && isTokenAccount(subAccount));

  const simpleTx = buildTonTransaction(transaction, accountInfo.seqno, account);
  if (tokenTransfer && simpleTx.payload && isJettonTransfer(simpleTx.payload)) {
    simpleTx.payload = undefined;
  }
  let fees = BigNumber(toNano(MAX_FEE_TOKEN_TRANSFER).toString());
  if (!tokenTransfer) {
    fees = await getTonEstimatedFees(account, accountInfo.status === "uninit", simpleTx);
  }
  let amount;
  if (transaction.useAllAmount) {
    amount = subAccount ? subAccount.spendableBalance : account.spendableBalance.minus(fees);
  } else {
    amount = transaction.amount;
  }

  return defaultUpdateTransaction(transaction, { fees, amount });
};

export default prepareTransaction;
