/**
 * The query and mutation keys of the Ledger Sync hooks. Invalidate the members list with
 * `[LedgerSyncQueryKey.members]`.
 *
 * @example
 * ```ts
 * queryClient.invalidateQueries({ queryKey: [LedgerSyncQueryKey.members] });
 * ```
 */
export const LedgerSyncQueryKey = Object.freeze({
  members: "useGetMembers",
  restore: "restoreTrustchain",
  destroy: "destroyTrustchain",
  keyRingStatus: "fetchTrustchainStatus",
  cloudSyncStatus: "fetchCloudSyncStatus",
} as const);
