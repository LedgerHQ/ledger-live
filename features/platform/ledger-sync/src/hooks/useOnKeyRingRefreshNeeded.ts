import { useCallback, useMemo } from "react";
import { selectHasKeyRingMemberKey, selectKeyRingTreeId } from "@domain/entity-key-ring";
import {
  classifyKeyRingError,
  commitKeyRingTree,
  resetKeyRingState,
  type KeyRingClient,
  type KeyRingErrorCategory,
  type KeyRingSession,
} from "@features/platform-key-ring";
import { log } from "@ledgerhq/logs";
import { trackLedgerSyncDeactivated } from "../analytics";
import type { KeyRingRefreshOptions } from "../types";
import {
  useLedgerSyncDispatch,
  useLedgerSyncSelector,
  useLedgerSyncStore,
} from "../internals/store";

/**
 * The `onRefreshNeeded` port of the wallet sync watcher: restores the key tree after a rotation by
 * another instance. A restore failing with one of `resetOnCategories` resets Ledger Sync and
 * tracks `ledgersync_deactivated`; any other failure is ignored. Does nothing without a member key.
 *
 * @example
 * ```ts
 * const onRefreshNeeded = useOnKeyRingRefreshNeeded(keyRing, {
 *   resetOnCategories: ["member-removed"],
 *   readTreeIdAt: "call",
 * });
 * ```
 */
export function useOnKeyRingRefreshNeeded(
  client: KeyRingClient,
  { resetOnCategories, readTreeIdAt }: KeyRingRefreshOptions,
): (session: KeyRingSession) => Promise<void> {
  const dispatch = useLedgerSyncDispatch();
  const store = useLedgerSyncStore();
  const hasMemberKey = useLedgerSyncSelector(selectHasKeyRingMemberKey);
  const renderTreeId = useLedgerSyncSelector(
    readTreeIdAt === "render" ? selectKeyRingTreeId : selectNoTreeId,
  );
  // A key, so a new array with the same categories keeps the handler.
  const resetCategoriesKey = resetOnCategories.join(",");
  const resetCategories = useMemo(
    () => new Set(resetCategoriesKey.split(",") as KeyRingErrorCategory[]),
    [resetCategoriesKey],
  );

  return useCallback(
    async (session: KeyRingSession) => {
      try {
        if (!hasMemberKey) return;
        const treeId =
          readTreeIdAt === "render" ? renderTreeId : selectKeyRingTreeId(store.getState());
        log("walletsync", "onTrustchainRefreshNeeded " + treeId);
        const tree = await client.restore(session);
        dispatch(commitKeyRingTree(tree));
      } catch (e) {
        const category = classifyKeyRingError(e);
        if (category && resetCategories.has(category)) {
          dispatch(resetKeyRingState());
          trackLedgerSyncDeactivated();
        }
      }
    },
    [dispatch, client, hasMemberKey, store, readTreeIdAt, renderTreeId, resetCategories],
  );
}

function selectNoTreeId(): null {
  return null;
}
