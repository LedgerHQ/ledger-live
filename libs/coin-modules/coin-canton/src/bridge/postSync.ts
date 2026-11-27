import { shouldRetainPendingOperation } from "@ledgerhq/ledger-wallet-framework/account/pending";
import type { Operation } from "@ledgerhq/types-live";
import type { CantonAccount } from "../types";

/**
 * Removes a pending operation once the sync returns an operation of its hash, or after the retention.
 * Canton has no nonce, so the framework cannot match a pending operation by sequence number. It
 * applies the retention to the main account only, so the sub-accounts get it here.
 *
 * `initial` is the account as it is now. The synced token accounts carry the pending operations of
 * the sync's start, so a token send broadcast during the sync is taken from `initial`.
 */
export function postSync(initial: CantonAccount, synced: CantonAccount): CantonAccount {
  const syncedHashes = new Set(
    [synced, ...(synced.subAccounts ?? [])].flatMap(({ operations }) =>
      operations.map(({ hash }) => hash),
    ),
  );
  const isPending = (op: Operation) =>
    !syncedHashes.has(op.hash) && shouldRetainPendingOperation(synced, op);
  const currentPending = new Map(
    (initial.subAccounts ?? []).map(({ id, pendingOperations }) => [id, pendingOperations]),
  );

  return {
    ...synced,
    pendingOperations: synced.pendingOperations.filter(isPending),
    ...(synced.subAccounts
      ? {
          subAccounts: synced.subAccounts.map(subAccount => ({
            ...subAccount,
            pendingOperations: (
              currentPending.get(subAccount.id) ?? subAccount.pendingOperations
            ).filter(isPending),
          })),
        }
      : {}),
  };
}
