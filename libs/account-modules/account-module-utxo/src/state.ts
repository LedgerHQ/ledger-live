import type { Versioned } from "@ledgerhq/account-module-framework";
import { UTXO_ACCOUNT_STATE_VERSION, type UtxoAccountState } from "./types";

export const emptyState = (): UtxoAccountState => ({
  syncedHeight: 0,
  anchor: null,
  addresses: [],
  confirmedUtxos: [],
  utxos: [],
});

export const versioned = (data: UtxoAccountState): Versioned<UtxoAccountState> => ({
  version: UTXO_ACCOUNT_STATE_VERSION,
  data,
});

/** A state of another version, or malformed, is not trusted: the account syncs from scratch. */
export function readState(
  state: Versioned<UtxoAccountState> | undefined,
): UtxoAccountState | undefined {
  if (state?.version !== UTXO_ACCOUNT_STATE_VERSION) return undefined;
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
  return data as UtxoAccountState;
}

export class UtxoAccountNotSyncedError extends Error {
  constructor() {
    super("The account has no state: sync it first");
    this.name = "UtxoAccountNotSyncedError";
  }
}
