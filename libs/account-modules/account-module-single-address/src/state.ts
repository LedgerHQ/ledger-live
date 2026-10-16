import type { StateStore, Versioned } from "@ledgerhq/account-module-framework";
import {
  SINGLE_ADDRESS_ACCOUNT_STATE_VERSION,
  type SingleAddressAccountState,
  type SingleAddressScope,
} from "./types";

const SCOPES: readonly SingleAddressScope[] = ["balances", "stakes", "operations"];

const neverRefreshed = (): SingleAddressAccountState["refreshedAt"] => ({
  balances: 0,
  stakes: 0,
  operations: 0,
});

export const emptyState = (): SingleAddressAccountState => ({
  syncedHeight: 0,
  balances: [],
  stakes: [],
  refreshedAt: neverRefreshed(),
});

export const versioned = (
  data: SingleAddressAccountState,
): Versioned<SingleAddressAccountState> => ({
  version: SINGLE_ADDRESS_ACCOUNT_STATE_VERSION,
  data,
});

const isRefreshTimes = (value: unknown): value is SingleAddressAccountState["refreshedAt"] =>
  typeof value === "object" &&
  value !== null &&
  SCOPES.every(scope => typeof (value as Record<string, unknown>)[scope] === "number");

/**
 * The state in the current version. Version 1 had no refresh times: it migrates with 0 (never
 * known). A state of another version, or malformed, is not trusted: the account syncs from scratch.
 */
export function readState(
  state: Versioned<SingleAddressAccountState> | undefined,
): SingleAddressAccountState | undefined {
  if (state?.version !== 1 && state?.version !== SINGLE_ADDRESS_ACCOUNT_STATE_VERSION) {
    return undefined;
  }
  const data = state.data as Partial<SingleAddressAccountState> | null;
  if (
    !data ||
    typeof data.syncedHeight !== "number" ||
    !Array.isArray(data.balances) ||
    !Array.isArray(data.stakes)
  ) {
    return undefined;
  }
  if (state.version === 1)
    return { ...data, refreshedAt: neverRefreshed() } as SingleAddressAccountState;
  return isRefreshTimes(data.refreshedAt) ? (data as SingleAddressAccountState) : undefined;
}

/** The stored state, in the current version; empty for an account never synced, or untrusted. */
export const storedState = async (
  store: StateStore<SingleAddressAccountState>,
): Promise<SingleAddressAccountState> => readState(await store.get()) ?? emptyState();
