import type { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { shouldRetainPendingOperation } from "../../account";

// we need to preserve ETH pendingOperations because there is no mempool to do this
// we assume we need to preserve until:
// - that txid appears in operations
// - the nonce is still lower than the last one in operations
const postSyncPatchGen = <T extends AccountLike>(
  initial: T,
  synced: T,
  latestNonce: number,
  mainAccount: Account,
  parentPendingOperation?: Operation[]
): T => {
  const pendingOperations = initial.pendingOperations || [];
  if (pendingOperations.length === 0) return synced;
  const { operations } = synced;
  synced.pendingOperations = pendingOperations.filter(
    (op) =>
      (!parentPendingOperation || // a child pending parent need to disappear if parent eth op disappear
        parentPendingOperation.some((o) => o.hash === op.hash)) &&
      op.transactionSequenceNumber &&
      op.transactionSequenceNumber > latestNonce && // retain logic
      (shouldRetainPendingOperation(mainAccount, op) || // after retain logic, we need operation to appear
        !operations.some((o) => o.hash === op.hash))
  );
  return synced;
};

const postSyncPatch = (initial: Account, synced: Account): Account => {
  const last = synced.operations.find((op) =>
    ["OUT", "FEES"].includes(op.type)
  );
  const latestNonce = last?.transactionSequenceNumber || 0;
  const acc = postSyncPatchGen(initial, synced, latestNonce, synced);
  const { subAccounts, pendingOperations } = acc;
  const initialSubAccounts = initial.subAccounts;

  if (subAccounts && initialSubAccounts) {
    acc.subAccounts = subAccounts.map((subAccount) => {
      const initialSubAccount = initialSubAccounts.find(
        (a) => a.id === subAccount.id
      );
      if (!initialSubAccount) return subAccount;
      return postSyncPatchGen(
        initialSubAccount,
        subAccount,
        latestNonce,
        acc,
        pendingOperations
      );
    });
  }

  return acc;
};

export default postSyncPatch;
