import { shouldRetainPendingOperation } from "@ledgerhq/ledger-wallet-framework/account/pending";
import type { Operation } from "@ledgerhq/types-live";
import type { CantonAccount } from "../types";

/**
 * Removes a pending operation once the sync returns an operation of its hash, or after the retention.
 * Canton has no nonce, so the framework cannot match a pending operation by sequence number. It
 * applies the retention to the main account only, so the sub-accounts get it here.
 */
export function postSync(_initial: CantonAccount, synced: CantonAccount): CantonAccount {
  const syncedHashes = new Set(
    [synced, ...(synced.subAccounts ?? [])].flatMap(({ operations }) =>
      operations.map(({ hash }) => hash),
    ),
  );
  const isPending = (op: Operation) =>
    !syncedHashes.has(op.hash) && shouldRetainPendingOperation(synced, op);

  return {
    ...synced,
    pendingOperations: synced.pendingOperations.filter(isPending),
    ...(synced.subAccounts
      ? {
          subAccounts: synced.subAccounts.map(subAccount => ({
            ...subAccount,
            pendingOperations: subAccount.pendingOperations.filter(isPending),
          })),
        }
      : {}),
  };
}
