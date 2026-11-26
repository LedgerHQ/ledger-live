import { useQuery } from "@tanstack/react-query";
import {
  commitKeyRingTree,
  selectKeyRingSession,
  type KeyRingClient,
} from "@features/platform-key-ring";
import { LedgerSyncQueryKey } from "../logic/queryKeys";
import type { LedgerSyncRestore } from "../types";
import { useLedgerSyncDispatch, useLedgerSyncSelector } from "../internals/store";

/**
 * Reloads the key tree after another instance rotated its key. The query never runs on its own:
 * call `refetch`.
 *
 * @example
 * ```ts
 * const { refetch: restoreKeyRing } = useRestoreKeyRing(client);
 * if (classifyKeyRingError(error) === "outdated") restoreKeyRing();
 * ```
 */
export function useRestoreKeyRing(client: KeyRingClient): LedgerSyncRestore {
  const dispatch = useLedgerSyncDispatch();
  const session = useLedgerSyncSelector(selectKeyRingSession);

  async function restoreKeyRing() {
    const tree = await client.restore(session);
    dispatch(commitKeyRingTree(tree));
    return tree;
  }

  return useQuery({
    enabled: false,
    queryKey: [LedgerSyncQueryKey.restore],
    queryFn: restoreKeyRing,
  });
}
