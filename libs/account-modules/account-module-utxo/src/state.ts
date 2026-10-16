import type { StateStore, Versioned } from "@ledgerhq/account-module-framework";
import { UTXO_ACCOUNT_STATE_VERSION, type UtxoAccountState } from "./types";

export const emptyState = (): UtxoAccountState => ({
  syncedHeight: 0,
  anchor: null,
  addresses: [],
  confirmedUtxos: [],
  utxos: [],
  refreshedAt: 0,
});

export const versioned = (data: UtxoAccountState): Versioned<UtxoAccountState> => ({
  version: UTXO_ACCOUNT_STATE_VERSION,
  data,
});

/**
 * The state in the current version. Version 1 had no refresh time: it migrates with 0 (never
 * known). A state of another version, or malformed, is not trusted: the account syncs from scratch.
 */
export function readState(
  state: Versioned<UtxoAccountState> | undefined,
): UtxoAccountState | undefined {
  if (state?.version !== 1 && state?.version !== UTXO_ACCOUNT_STATE_VERSION) return undefined;
  const data = state.data as Partial<UtxoAccountState> | null;
  if (
    !data ||
    typeof data.syncedHeight !== "number" ||
    !Array.isArray(data.addresses) ||
    !Array.isArray(data.confirmedUtxos) ||
    !Array.isArray(data.utxos)
  ) {
    return undefined;
  }
  if (state.version === 1) return { ...data, refreshedAt: 0 } as UtxoAccountState;
  return typeof data.refreshedAt === "number" ? (data as UtxoAccountState) : undefined;
}

/** The stored state, in the current version; `undefined` for an account never synced, or untrusted. */
export const storedState = async (
  store: StateStore<UtxoAccountState>,
): Promise<UtxoAccountState | undefined> => readState(await store.get());

export class UtxoAccountNotSyncedError extends Error {
  constructor() {
    super("The account has no state: sync it first");
    this.name = "UtxoAccountNotSyncedError";
  }
}
