// @flow
import type { Account, TokenAccount } from "../../types";

// we need to preserve ETH pendingOperations because there is no mempool to do this
// we assume we need to preserve until:
// - that txid appears in operations
// - the nonce is still lower than the last one in operations

const postSyncPatchGen = <T: Account | TokenAccount>(
  initial: T,
  synced: T
): T => {
  let pendingOperations = initial.pendingOperations || [];
  if (pendingOperations.length === 0) return synced;
  const { operations } = synced;
  const nonce =
    (operations.length > 0 && operations[0].transactionSequenceNumber) || 0;
  synced.pendingOperations = pendingOperations.filter(
    ({ transactionSequenceNumber, hash }) =>
      transactionSequenceNumber &&
      transactionSequenceNumber >= nonce &&
      !operations.some(op => op.hash === hash)
  );
  return synced;
};

const postSyncPatch = (initial: Account, synced: Account): Account => {
  const acc = postSyncPatchGen(initial, synced);
  const { tokenAccounts } = acc;
  const initialTAs = initial.tokenAccounts;
  if (tokenAccounts && initialTAs) {
    acc.tokenAccounts = tokenAccounts.map(ta => {
      const initialTA = initialTAs.find(t => t.id === ta.id);
      if (!initialTA) return ta;
      return postSyncPatchGen(initialTA, ta);
    });
  }
  return acc;
};

export default postSyncPatch;
