import { useCallback } from "react";
import { memberCredentialsSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useStore } from "~/context/hooks";

/**
 * A Ledger Sync reset rotates the member credentials, so the result of a run started with other
 * credentials belongs to a Ledger Sync that is gone and must not be stored. Reads the store when
 * called: the result can arrive after the step unmounted.
 */
export function useIsCurrentMemberCredentials() {
  const store = useStore();
  return useCallback(
    (runCredentials: MemberCredentials) =>
      memberCredentialsSelector(store.getState())?.pubkey === runCredentials.pubkey,
    [store],
  );
}
