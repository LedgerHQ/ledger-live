import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

/**
 * After each sync or scan, remove operations from the pending pools if necessary
 * Operations stay pending if and only if
 *  - they are confirmed, i.e. their hash appear in the operation list
 *  - they are not outdated, i.e. their sequence number is at least greater than the
 *    sequence number of the latest transaction
 * NOTE Compared to the default behaviour
 *  - pending operations of token accounts are cleaned up, so we don't see both pending and completed
 *    sub operations in the operation details drawer
 *  - pending operations are cleaned if their hash already belong to the completed operations, preventing
 *    undesired replacement (ex: optimistic operation for self token sending on EVM is incomplete, since
 *    it only contains the OUT sub operation)
 */
export function postSync(initial: Account, synced: Account): Account {
  const lastOperation = synced.operations.find(op => ["OUT", "FEES"].includes(op.type));
  const latestSequence = lastOperation?.transactionSequenceNumber || new BigNumber(-1);

  function isPending(account: AccountLike, op: Operation): boolean {
    return (
      // Operation is not confirmed
      !account.operations.some(o => o.hash === op.hash) &&
      // Operation is not outdated
      op.transactionSequenceNumber !== undefined &&
      op.transactionSequenceNumber.gt(latestSequence)
    );
  }

  const pendingOperations = initial.pendingOperations.length
    ? initial.pendingOperations.filter(op => isPending(synced, op))
    : [];
  const subAccounts = synced.subAccounts?.length
    ? synced.subAccounts.map(subAccount => ({
        ...subAccount,
        pendingOperations: subAccount.pendingOperations.filter(op => isPending(subAccount, op)),
      }))
    : [];

  return { ...synced, pendingOperations, subAccounts };
}
