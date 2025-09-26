import { OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { TezosAccount, TezosOperation, Transaction } from "../types";
import BigNumber from "bignumber.js";

export const buildOptimisticOperation = (
  account: TezosAccount,
  transaction: Transaction,
  operationType: OperationType,
): TezosOperation => {
  const txHash = ""; // resolved at broadcast time
  const { id: accountId } = account;

  return {
    id: encodeOperationId(accountId, txHash, operationType),
    hash: txHash,
    type: operationType,
    value: transaction.amount,
    fee: transaction.fees || new BigNumber(0),
    extra: {},
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId,
    date: new Date(),
  };
};
