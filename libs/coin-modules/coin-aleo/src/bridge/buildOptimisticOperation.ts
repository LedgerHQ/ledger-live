import type { Account, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { AleoOperation, Transaction } from "../types";
import { getOperationTransactionType } from "../logic/utils";

export function buildOptimisticOperation({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): AleoOperation {
  const fee = transaction.fees;
  const value = transaction.amount;
  const type: OperationType = "OUT";

  const operation: AleoOperation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    extra: {
      functionId: "",
      transactionType: getOperationTransactionType(transaction.mode),
    },
  };

  return operation;
}
