import { Account, Operation } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/lib/operation";

export const buildOptimisticOperation = async (
  account: Account,
  transaction: Transaction,
): Promise<Operation> => {
  const TYPE_OUT = "OUT";
  const subAccountId = transaction.subAccountId;
  const operation: Operation = {
    id: encodeOperationId(account.id, "", TYPE_OUT),
    hash: "",
    type: subAccountId ? "NONE" : TYPE_OUT,
    value: subAccountId ? new BigNumber(0) : new BigNumber(transaction.amount),
    fee: subAccountId ? new BigNumber(0) : new BigNumber(transaction.estimatedFees),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    date: new Date(),
    extra: {},
    subOperations: subAccountId
      ? [
          {
            id: encodeOperationId(subAccountId, "", "OUT"),
            hash: "",
            type: "OUT",
            value: transaction.amount,
            fee: subAccountId ? new BigNumber(transaction.estimatedFees) : new BigNumber(0),
            blockHash: null,
            blockHeight: null,
            senders: [account.freshAddress],
            recipients: [transaction.recipient].filter(Boolean),
            accountId: subAccountId,
            date: new Date(),
            extra: {},
          },
        ]
      : [],
  };

  return operation;
};
