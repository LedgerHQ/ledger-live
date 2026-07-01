import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AleoOperation, AleoOperationExtra, Transaction } from "../types";
import { TRANSACTION_TYPE } from "../constants";
import {
  getFunctionNameFromTransactionType,
  getNextSequenceNumber,
  getOperationTransactionType,
  getStakingOperationType,
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
  const stakingType = getStakingOperationType(transaction.mode);
  const value = isTokenTx || stakingType ? fee : transaction.amount;
  const mainOperationType: OperationType = isTokenTx ? "FEES" : (stakingType ?? "OUT");
  const subOperations: Operation[] = [];
  const tokenSubAccount = account.subAccounts?.find(s => s.id === transaction.subAccountId);
  const transactionSequenceNumber = getNextSequenceNumber(account);
  const extra: AleoOperationExtra = {
    functionId: getFunctionNameFromTransactionType(transaction.mode),
    transactionType: getOperationTransactionType(transaction.mode),
    ...(transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC && {
      estimatedBondedAmount: transaction.amount,
    }),
    ...(transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC && {
      estimatedUnbondedAmount: transaction.amount,
    }),
  };

  if (isTokenTx && tokenSubAccount) {
    const subOperationType: OperationType = "OUT";
    const tokenOp: Operation = {
      id: encodeOperationId(tokenSubAccount.id, "", subOperationType),
      hash: "",
      type: subOperationType,
      value: transaction.amount,
      fee,
      blockHash: null,
      blockHeight: null,
      senders: [account.freshAddress],
      recipients: [transaction.recipient],
      accountId: tokenSubAccount.id,
      date: new Date(),
      transactionSequenceNumber,
      extra,
    };

    subOperations.push(tokenOp);
  }

  const operation: AleoOperation = {
    id: encodeOperationId(account.id, "", mainOperationType),
    hash: "",
    type: mainOperationType,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    transactionSequenceNumber,
    extra,
    ...(subOperations.length > 0 && { subOperations }),
  };

  return operation;
}
