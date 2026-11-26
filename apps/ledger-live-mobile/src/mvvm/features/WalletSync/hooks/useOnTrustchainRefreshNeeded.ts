import { track } from "@shared/analytics";
import { useCallback } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  classifyKeyRingError,
  commitKeyRingTree,
  resetKeyRingState,
  type KeyRingClient,
  type KeyRingSession,
} from "@features/platform-key-ring";
import { selectHasKeyRingMemberKey, selectKeyRingTreeId } from "@domain/entity-key-ring";
import { log } from "@ledgerhq/logs";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";

export function useOnTrustchainRefreshNeeded(
  client: KeyRingClient,
): (session: KeyRingSession) => Promise<void> {
  const dispatch = useDispatch();
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const treeId = useSelector(selectKeyRingTreeId);
  const onTrustchainRefreshNeeded = useCallback(
    async (session: KeyRingSession) => {
      try {
        if (!hasMemberKey) return;
        log("walletsync", "onTrustchainRefreshNeeded " + treeId);
        const newTree = await client.restore(session);
        dispatch(commitKeyRingTree(newTree));
      } catch (e) {
        const category = classifyKeyRingError(e);
        if (category === "member-removed" || category === "not-allowed") {
          dispatch(resetKeyRingState());
          track(AnalyticsEvents.LedgerSyncDeactivated);
        }
      }
    },
    [dispatch, client, hasMemberKey, treeId],
  );
  return onTrustchainRefreshNeeded;
}
