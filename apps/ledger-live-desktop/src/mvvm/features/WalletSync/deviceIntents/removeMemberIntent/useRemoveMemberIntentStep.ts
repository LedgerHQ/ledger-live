import { useCallback, useEffect, useRef } from "react";
import { createIntent } from "@features/platform-device-intent";
import { selectHasKeyRingMemberKey, selectIsKeyRingMember } from "@domain/entity-key-ring";
import {
  acceptLedgerSyncResult,
  commitKeyRingTree,
  selectKeyRingSession,
  type KeyRingMember,
  type KeyRingSession,
  type KeyRingTreeUpdate,
  type RemoveMemberIntent,
  type RemoveMemberJobState,
} from "@features/platform-key-ring";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useKeyRingClient } from "../../hooks/useKeyRingClient";
import { ledgerSyncResultOrder } from "../ledgerSyncResultOrder";
import { removeMemberIntentLWDDefinition } from "./intentLWDDefinition";

/**
 * Removes another instance from the trustchain on DIE, then leaves the device step the way the
 * legacy `DeleteInstanceWithTrustChain` step does.
 */
export function useRemoveMemberIntentStep(
  member: KeyRingMember | null,
  onError: (error: Error) => void,
) {
  const dispatch = useDispatch();
  const client = useKeyRingClient();
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const isMember = useSelector(selectIsKeyRingMember);
  const session = useSelector(selectKeyRingSession);
  const isStoredRef = useRef(false);

  const onUserCancel = useCallback(
    () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances })),
    [dispatch],
  );

  useEffect(() => {
    if (!member) onUserCancel();
  }, [member, onUserCancel]);

  const onResult = useCallback(
    (newTrustchain: KeyRingTreeUpdate, runSession: KeyRingSession) => {
      if (!dispatch(acceptLedgerSyncResult(commitKeyRingTree(newTrustchain), runSession))) return;
      isStoredRef.current = true;
    },
    [dispatch],
  );

  const onJobStateChanged = useCallback(
    (jobState: RemoveMemberJobState) => {
      if (jobState.type === "completed") {
        if (!isStoredRef.current) return;
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
      } else if (jobState.type === "failed" && jobState.reason === "not-allowed") {
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.UnsecuredLedger }));
      } else if (jobState.type === "failed") {
        onError(jobState.error);
      }
    },
    [dispatch, onError],
  );

  const createRunIntent =
    member && isMember && hasMemberKey
      ? (): RemoveMemberIntent =>
          createIntent(
            removeMemberIntentLWDDefinition,
            {
              session,
              member,
              client,
              resultOrder: ledgerSyncResultOrder,
            },
            {
              onResult: newTrustchain => onResult(newTrustchain, session),
              onJobStateChanged,
            },
          )
      : null;

  return { createRunIntent, onUserCancel };
}
