import { useCallback } from "react";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
import { selectHasKeyRingMemberKey, selectKeyRingTreeId } from "@domain/entity-key-ring";
import {
  commitKeyRingTree,
  isKeyRingError,
  resetKeyRingState,
  type KeyRingClient,
  type KeyRingSession,
} from "@features/platform-key-ring";
import { log } from "@ledgerhq/logs";
import { track } from "@shared/analytics";

export function useOnTrustchainRefreshNeeded(
  client: KeyRingClient,
): (session: KeyRingSession) => Promise<void> {
  const dispatch = useDispatch();
  const store = useStore();
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const onTrustchainRefreshNeeded = useCallback(
    async (session: KeyRingSession) => {
      try {
        if (!hasMemberKey) return;
        log("walletsync", "onTrustchainRefreshNeeded " + selectKeyRingTreeId(store.getState()));
        const newTrustchain = await client.restore(session);
        dispatch(commitKeyRingTree(newTrustchain));
      } catch (e) {
        if (isKeyRingError(e, "member-removed")) {
          dispatch(resetKeyRingState());
          track("ledgersync_deactivated");
        }
      }
    },
    [dispatch, client, hasMemberKey, store],
  );
  return onTrustchainRefreshNeeded;
}
