import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AleoOperation, Transaction } from "../types";
import {
  getFunctionNameFromTransactionType,
  getNextSequenceNumber,
  getOperationTransactionType,
  isTokenTransaction,
} from "../logic/utils";

export function buildOptimisticOperation({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): AleoOperation {
  const fee = transaction.fees;
  const isTokenTx = isTokenTransaction(transaction);
  const value = isTokenTx ? fee : transaction.amount;
  const type: OperationType = isTokenTx ? "FEES" : "OUT";
  const subOperations: Operation[] = [];
  const tokenSubAccount = account.subAccounts?.find(s => s.id === transaction.subAccountId);

  if (isTokenTx && tokenSubAccount) {
    const tokenOp: Operation = {
      id: encodeOperationId(tokenSubAccount.id, "", type),
      hash: "",
      type,
      value: transaction.amount,
      fee,
      blockHash: null,
      blockHeight: null,
      senders: [account.freshAddress],
      recipients: [transaction.recipient],
      accountId: tokenSubAccount.id,
      date: new Date(),
      extra: {},
    };

    subOperations.push(tokenOp);
  }

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
    ...(subOperations.length > 0 && { subOperations }),
  };

  return operation;
}
