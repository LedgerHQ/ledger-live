// @flow
import type { AccountLike, Account } from "../../types";

// we need to preserve ETH pendingOperations because there is no mempool to do this
// we assume we need to preserve until:
// - that txid appears in operations
// - the nonce is still lower than the last one in operations

const postSyncPatchGen = <T: AccountLike>(
  initial: T,
  synced: T,
  latestNonce: number // latest eth op nonce
): T => {
  let pendingOperations = initial.pendingOperations || [];
  if (pendingOperations.length === 0) return synced;
  const { operations } = synced;
  synced.pendingOperations = pendingOperations.filter(
    ({ transactionSequenceNumber, hash }) =>
      transactionSequenceNumber &&
      transactionSequenceNumber >= latestNonce &&
      !operations.some(op => op.hash === hash)
  );
  return synced;
};

const postSyncPatch = (initial: Account, synced: Account): Account => {
  const sendingOps = (synced.operations || []).filter(op => op.type === "OUT");
  const latestNonce =
    (sendingOps.length > 0 && sendingOps[0].transactionSequenceNumber) || 0;
  const acc = postSyncPatchGen(initial, synced, latestNonce);
  const { subAccounts } = acc;
  const initialTAs = initial.subAccounts;
  if (subAccounts && initialTAs) {
    acc.subAccounts = subAccounts.map(ta => {
      const initialTA = initialTAs.find(t => t.id === ta.id);
      if (!initialTA) return ta;
      return postSyncPatchGen(initialTA, ta, latestNonce);
    });
  }
  return acc;
};

export default postSyncPatch;
