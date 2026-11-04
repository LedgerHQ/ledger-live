import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";

/*
We want to discard pendingOperations if their transaction sequence number
has been out-numbered by the last operation...
*/
export function shouldRetainPendingOperation(account: Account, op: Operation): boolean {
  // FIXME: valueOf to compare dates in typescript
  const delay = new Date().valueOf() - op.date.valueOf();
  const last = account.operations.find(o => o.senders.includes(op.senders[0]));

  if (
    last &&
    last.transactionSequenceNumber &&
    op.transactionSequenceNumber &&
    op.transactionSequenceNumber.lte(last.transactionSequenceNumber)
  ) {
    return false;
  }

  return delay < getEnv("OPERATION_OPTIMISTIC_RETENTION");
}

/**
 * Appends a pending operation to the list, ensuring no duplicates based on transactionSequenceNumber.
 *
 * If another operation in the list has the same `transactionSequenceNumber` as the new one,
 * it is removed first — the new one replaces it at the beginning of the list.
 *
 * This ensures optimistic operations (e.g., from RBF or retry logic) don't stack up multiple times
 * when they refer to the same transaction.
 *
 * UTXO operations (both carrying `extra.inputs` outpoints) have no sequence number: an existing one
 * is removed only when the new one spends one of its inputs (an RBF replacement), so the account
 * keeps every pending send and its inputs are not spent twice. The unconfirmed descendants of a
 * replaced operation (spending its outputs, transitively) are removed too.
 *
 * Otherwise, when either `transactionSequenceNumber` is `undefined`, an existing op is removed when
 * both are `undefined`.
 *
 * @param ops - Existing list of pending operations
 * @param op - The new pending operation to insert
 * @returns A new array with `op` prepended and any conflicting op removed
 */
const spentOutpoints = (op: Operation): unknown[] | undefined => {
  const inputs = (op.extra as { inputs?: unknown } | undefined)?.inputs;
  return Array.isArray(inputs) ? inputs : undefined;
};

const spendsOutputOf = (op: Operation, txHashes: Set<string>): boolean =>
  (spentOutpoints(op) ?? []).some(
    input => typeof input === "string" && txHashes.has(input.slice(0, input.lastIndexOf("-"))),
  );

const appendPendingOp = (ops: Operation[], op: Operation) => {
  const newInputs = spentOutpoints(op);
  const replacedHashes = new Set<string>();
  let filtered: Operation[] = ops.filter(o => {
    const a = o.transactionSequenceNumber;
    const b = op.transactionSequenceNumber;
    if (a && b) return !a.eq(b);
    const existingInputs = spentOutpoints(o);
    if (newInputs && existingInputs) {
      const isReplaced = existingInputs.some(input => newInputs.includes(input));
      if (isReplaced) replacedHashes.add(o.hash);
      return !isReplaced;
    }
    return a !== b;
  });

  // A replaced UTXO transaction takes its unconfirmed descendants with it: they can never confirm.
  let removedDescendant = replacedHashes.size > 0;
  while (removedDescendant) {
    removedDescendant = false;
    filtered = filtered.filter(o => {
      if (!spendsOutputOf(o, replacedHashes)) return true;
      replacedHashes.add(o.hash);
      removedDescendant = true;
      return false;
    });
  }

  filtered.unshift(op);
  return filtered;
};

function addInSubAccount(subaccounts: TokenAccount[], op: Operation) {
  const acc = subaccounts.find(sub => sub.id === op.accountId);

  if (acc) {
    const copy: TokenAccount = { ...acc };
    copy.pendingOperations = appendPendingOp(acc.pendingOperations, op);
    subaccounts[subaccounts.indexOf(acc)] = copy;
  }
}

export const addPendingOperation = (account: Account, operation: Operation): Account => {
  const accountCopy = { ...account };
  const { subOperations } = operation;
  const { subAccounts } = account;

  if (subOperations && subAccounts) {
    const taCopy: TokenAccount[] = subAccounts.slice(0);
    subOperations.forEach(op => {
      addInSubAccount(taCopy, op);
    });
    accountCopy.subAccounts = taCopy;
  }

  if (accountCopy.id === operation.accountId) {
    accountCopy.pendingOperations = appendPendingOp(accountCopy.pendingOperations, operation);
  } else if (subAccounts) {
    const taCopy: TokenAccount[] = subAccounts.slice(0);
    addInSubAccount(taCopy, operation);
    accountCopy.subAccounts = taCopy;
  }

  return accountCopy;
};
