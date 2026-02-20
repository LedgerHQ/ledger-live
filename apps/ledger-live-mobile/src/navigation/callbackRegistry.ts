/**
 * Registry for navigation callbacks so they are not passed in route params (non-serializable).
 * Callers register callbacks before navigating and pass the returned id in params;
 * screens retrieve and invoke callbacks by id, then unregister.
 */
import type { Account } from "@ledgerhq/types-live";

export type AddAccountFlowCallbacks = {
  onSuccess?: (res?: { scannedAccounts: Account[]; selected: Account[] }) => void;
  onCloseNavigation?: () => void;
};

const registry = new Map<string, AddAccountFlowCallbacks>();

let nextId = 0;

export function registerAddAccountCallbacks(callbacks: AddAccountFlowCallbacks): string {
  const id = `addAccount_${nextId++}`;
  registry.set(id, callbacks);
  return id;
}

export function getAddAccountCallbacks(id: string): AddAccountFlowCallbacks | undefined {
  return registry.get(id);
}

export function unregisterAddAccountCallbacks(id: string): void {
  registry.delete(id);
}
