import { useCallback, useEffect } from "react";
import { selectHasKeyRingMemberKey } from "@domain/entity-key-ring";
import { commitKeyRingMemberKey, type KeyRingClient } from "@features/platform-key-ring";
import type { LedgerSyncMemberKeyInit } from "../types";
import { useLedgerSyncDispatch, useLedgerSyncSelector } from "../internals/store";

/**
 * Gives this instance a member key when it has none, on mount and whenever it loses it.
 *
 * @example
 * ```ts
 * const { hasMemberKey } = useInitMemberKey(client);
 * ```
 */
export function useInitMemberKey(client: KeyRingClient): LedgerSyncMemberKeyInit {
  const dispatch = useLedgerSyncDispatch();
  const hasMemberKey = useLedgerSyncSelector(selectHasKeyRingMemberKey);

  const generateMemberKey = useCallback(async () => {
    if (!hasMemberKey) {
      const memberKey = await client.createMemberKey();
      dispatch(commitKeyRingMemberKey(memberKey));
    }
  }, [hasMemberKey, client, dispatch]);

  useEffect(() => {
    void generateMemberKey();
  }, [generateMemberKey]);

  return { hasMemberKey, generateMemberKey };
}
