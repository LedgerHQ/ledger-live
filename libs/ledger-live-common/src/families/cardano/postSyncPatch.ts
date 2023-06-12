/**
 *  Code reference taken from src/families/ethereum/postSyncPatch.ts
 */

import type { AccountLike, Account, Operation } from "@ledgerhq/types-live";

// we need to preserve ADA pendingOperations because there is no mempool to do this
// we assume we need to preserve until:
// - that txid appears in operations
const postSyncPatchGen = <T extends AccountLike>(
  initial: T,
  synced: T,
  parentPendingOperation?: Operation[],
): T => {
  const pendingOperations = initial.pendingOperations || [];
  if (pendingOperations.length === 0) return synced;
  const { operations } = synced;
  synced.pendingOperations = pendingOperations.filter(
    op =>
      (!parentPendingOperation || // a child pending parent need to disappear if parent ada op disappear
        parentPendingOperation.some(o => o.hash === op.hash)) &&
      !operations.some(o => o.hash === op.hash), // after retain logic, we need operation to appear
  );
  return synced;
};

const postSyncPatch = (initial: Account, synced: Account): Account => {
  const acc = postSyncPatchGen(initial, synced);
  const { subAccounts, pendingOperations } = acc;
  const initialSubAccounts = initial.subAccounts;

  if (subAccounts && initialSubAccounts) {
    acc.subAccounts = subAccounts.map(subAccount => {
      const initialSubAccount = initialSubAccounts.find(a => a.id === subAccount.id);
      if (!initialSubAccount) return subAccount;
      return postSyncPatchGen(initialSubAccount, subAccount, pendingOperations);
    });
  }

  return acc;
};

export default postSyncPatch;
