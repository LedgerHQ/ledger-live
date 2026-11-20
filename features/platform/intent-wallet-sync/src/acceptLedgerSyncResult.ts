import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { isCurrentMemberCredentials } from "./isCurrentMemberCredentials";

type MemberCredentialsState = Parameters<typeof isCurrentMemberCredentials>[0];

/** Dispatches `action` unless Ledger Sync was reset since the run started. Returns whether it was dispatched. */
export function acceptLedgerSyncResult<A>(action: A, runCredentials: MemberCredentials) {
  return function accept(
    dispatch: (action: A) => unknown,
    getState: () => MemberCredentialsState,
  ): boolean {
    if (!isCurrentMemberCredentials(getState(), runCredentials)) return false;
    dispatch(action);
    return true;
  };
}
