import type { Versioned } from "@ledgerhq/account-module-framework";
import { SINGLE_ADDRESS_ACCOUNT_STATE_VERSION, type SingleAddressAccountState } from "./types";

export const emptyState = (): SingleAddressAccountState => ({
  syncedHeight: 0,
  balances: [],
  stakes: [],
});

export const versioned = (
  data: SingleAddressAccountState,
): Versioned<SingleAddressAccountState> => ({
  version: SINGLE_ADDRESS_ACCOUNT_STATE_VERSION,
  data,
});

/** A state of another version, or malformed, is not trusted: the account syncs from scratch. */
export function readState(
  state: Versioned<SingleAddressAccountState> | undefined,
): SingleAddressAccountState | undefined {
  if (state?.version !== SINGLE_ADDRESS_ACCOUNT_STATE_VERSION) return undefined;
  const data = state.data as Partial<SingleAddressAccountState> | null;
  if (
    !data ||
    typeof data.syncedHeight !== "number" ||
    !Array.isArray(data.balances) ||
    !Array.isArray(data.stakes)
  ) {
    return undefined;
  }
  return data as SingleAddressAccountState;
}
