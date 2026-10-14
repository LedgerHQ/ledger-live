import { v4 as uuid } from "uuid";
import type { Account } from "@ledgerhq/types-live";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";

type PendingMigrationRequest = {
  id: string;
  resolve: (accounts: Account[]) => void;
  reject: (error: Error) => void;
};

let pending: PendingMigrationRequest | null = null;

/**
 * Stays pending across the discovery screens until settled or cancelled. Starting a new one
 * cancels any request still pending, so it never hangs.
 */
export function beginMigrationRequest(): Promise<Account[]> {
  cancelMigrationRequest();
  const id = uuid();
  return new Promise((resolve, reject) => {
    pending = { id, resolve, reject };
  });
}

export function getMigrationRequestId(): string | null {
  return pending?.id ?? null;
}

export function settleMigrationRequest(id: string | null, accounts: Account[]) {
  if (id === null || pending?.id !== id) return;
  pending.resolve(accounts);
  pending = null;
}

/** With an `id`, only cancels that request, so a stale caller cannot cancel a newer one. */
export function cancelMigrationRequest(id?: string | null) {
  if (id !== undefined && pending?.id !== id) return;
  pending?.reject(new UserRefusedOnDevice());
  pending = null;
}
