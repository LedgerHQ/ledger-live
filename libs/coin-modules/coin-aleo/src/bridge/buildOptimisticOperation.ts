import type { Account, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AleoOperation, Transaction } from "../types";
import {
  getFunctionNameFromTransactionType,
  getNextSequenceNumber,
  getOperationTransactionType,
} from "../logic/utils";

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
    transactionSequenceNumber: getNextSequenceNumber(account),
    extra: {
      functionId: getFunctionNameFromTransactionType(transaction.mode),
      transactionType: getOperationTransactionType(transaction.mode),
    },
  };

  return operation;
}
