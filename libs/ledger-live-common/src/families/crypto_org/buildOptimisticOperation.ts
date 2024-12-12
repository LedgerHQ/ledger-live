import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { CryptoOrgOperation, Transaction } from "./types";

export const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
): CryptoOrgOperation => {
  const type = "OUT";
  const value = new BigNumber(transaction.amount).plus(fee);
  const operation: CryptoOrgOperation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    date: new Date(),
    extra: {
      memo: transaction.memo,
    },
  };
  return operation;
};
