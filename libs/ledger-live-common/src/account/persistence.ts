import type { Account, SwapOperation, TokenAccount } from "@ledgerhq/types-live";

/**
 * Whether the swap history changed in what is saved: a swap added or removed, or an existing one
 * with a new status, final amount or anchoring operation (a perps withdraw gets its payout tx).
 */
function swapHistoryChanged(
  prev: SwapOperation[] | undefined,
  next: SwapOperation[] | undefined,
): boolean {
  if (prev === next) return false;
  if ((prev?.length ?? 0) !== (next?.length ?? 0)) return true;
  return (prev ?? []).some((p, i) => {
    const n = next?.[i];
    return (
      !n ||
      p.swapId !== n.swapId ||
      p.status !== n.status ||
      p.operationId !== n.operationId ||
      p.finalAmount?.toString() !== n.finalAmount?.toString()
    );
  });
}

/**
 * Returns true when something that is persisted and user-visible (or structurally
 * relevant) changed between prev and next. Used to decide if an account is worth
 * re-saving to app.json / mmkv. Ignores lastSyncDate and other in-memory-only fields.
 */
export function accountPersistedStateChanged(prev: Account, next: Account): boolean {
  // critical fields that reflect changes
  if (prev.id !== next.id) return true;
  if (prev.syncHash !== next.syncHash) return true;

  // balances
  if (!prev.balance.eq(next.balance) || !prev.spendableBalance.eq(next.spendableBalance)) {
    return true;
  }

  // operations
  if (
    prev.operationsCount !== next.operationsCount ||
    prev.operations.length !== next.operations.length ||
    prev.pendingOperations.length !== next.pendingOperations.length
  ) {
    return true;
  }

  // swap history
  if (swapHistoryChanged(prev.swapHistory, next.swapHistory)) return true;

  // zcash private info (or any account with privateInfo)
  const prevPrivateInfo =
    "privateInfo" in prev ? (prev as { privateInfo?: any }).privateInfo : null;
  const nextPrivateInfo =
    "privateInfo" in next ? (next as { privateInfo?: any }).privateInfo : null;
  if (prevPrivateInfo || nextPrivateInfo) {
    if (!prevPrivateInfo || !nextPrivateInfo) return true;
    if (prevPrivateInfo.ufvk !== nextPrivateInfo.ufvk) return true;
    if (!prevPrivateInfo.balance?.eq?.(nextPrivateInfo.balance)) return true;
    if (prevPrivateInfo.birthday !== nextPrivateInfo.birthday) return true;
    if (prevPrivateInfo.lastSyncTimestamp !== nextPrivateInfo.lastSyncTimestamp) return true;
    if (prevPrivateInfo.lastSyncBlock !== nextPrivateInfo.lastSyncBlock) return true;
    if (prevPrivateInfo.syncState !== nextPrivateInfo.syncState) return true;
    if (prevPrivateInfo.lastProcessedBlock !== nextPrivateInfo.lastProcessedBlock) return true;
    if (prevPrivateInfo.currentSync?.state !== nextPrivateInfo.currentSync?.state) return true;
    if (
      prevPrivateInfo.currentSync?.lastBlockDownloaded !==
      nextPrivateInfo.currentSync?.lastBlockDownloaded
    )
      return true;
    if (
      prevPrivateInfo.currentSync?.lastProcessedBlock !==
      nextPrivateInfo.currentSync?.lastProcessedBlock
    )
      return true;
    if ((prevPrivateInfo.transactions?.length ?? 0) !== (nextPrivateInfo.transactions?.length ?? 0))
      return true;
  }

  // sub accounts
  if ((prev.subAccounts?.length ?? 0) !== (next.subAccounts?.length ?? 0)) return true;
  const prevSubs = prev.subAccounts ?? [];
  const nextSubs = next.subAccounts ?? [];
  for (let i = 0; i < prevSubs.length; i++) {
    const p = prevSubs[i];
    const n = nextSubs[i];
    if (!n || n.type !== "TokenAccount") return true;
    if (tokenAccountPersistedStateChanged(p, n)) return true;
  }

  return false;
}

/**
 * Returns true if the list of accounts has a change that is worth re-saving
 * (new/removed account or any account with persisted state changed).
 * Compares by index, like subAccounts.
 */
export function accountsPersistedStateChanged(
  oldAccounts: Account[],
  newAccounts: Account[],
): boolean {
  if (oldAccounts.length !== newAccounts.length) return true;
  for (let i = 0; i < newAccounts.length; i++) {
    if (accountPersistedStateChanged(oldAccounts[i], newAccounts[i])) return true;
  }
  return false;
}

function tokenAccountPersistedStateChanged(prev: TokenAccount, next: TokenAccount): boolean {
  return (
    prev.id !== next.id ||
    !prev.balance.eq(next.balance) ||
    prev.operationsCount !== next.operationsCount ||
    // As for main accounts: swaps recorded on a token account (e.g. a perps withdraw) are saved.
    swapHistoryChanged(prev.swapHistory, next.swapHistory)
  );
}
