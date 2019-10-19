// @flow
import type { Account, Operation, SubAccount } from "../types";
import { getEnv } from "../env";

export function shouldRetainPendingOperation(
  account: Account,
  op: Operation
): boolean {
  const delay = new Date() - op.date;
  return delay < getEnv("OPERATION_OPTIMISTIC_RETENTION");
}

const appendPendingOp = (ops: Operation[], op: Operation) => {
  const filtered: Operation[] = ops.filter(
    o => o.transactionSequenceNumber === op.transactionSequenceNumber
  );
  filtered.push(op);
  return filtered;
};

export const addPendingOperation = (account: Account, operation: Operation) => {
  const accountCopy = { ...account };
  const { subOperations } = operation;
  const { subAccounts } = account;

  function addInSubAccount(subaccounts, op) {
    const acc = subaccounts.find(sub => sub.id === op.accountId);
    if (acc) {
      // $FlowFixMe
      const copy: SubAccount = { ...acc };
      copy.pendingOperations = appendPendingOp(acc.pendingOperations, op);
      subaccounts[subaccounts.indexOf(acc)] = copy;
    }
  }

  if (subOperations && subAccounts) {
    const taCopy: SubAccount[] = subAccounts.slice(0);
    subOperations.forEach(op => {
      addInSubAccount(taCopy, op);
    });
    accountCopy.subAccounts = taCopy;
  }
  if (accountCopy.id === operation.accountId) {
    accountCopy.pendingOperations = appendPendingOp(
      accountCopy.pendingOperations,
      operation
    );
  } else if (subAccounts) {
    const taCopy: SubAccount[] = subAccounts.slice(0);
    addInSubAccount(taCopy, operation);
    accountCopy.subAccounts = taCopy;
  }
  return accountCopy;
};
