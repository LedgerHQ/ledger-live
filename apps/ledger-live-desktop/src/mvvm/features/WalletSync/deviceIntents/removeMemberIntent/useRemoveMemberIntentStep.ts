import { useCallback, useEffect } from "react";
import { createIntent } from "@features/platform-device-intent";
import { selectHasKeyRingMemberKey, selectIsKeyRingMember } from "@domain/entity-key-ring";
import {
  buildRemoveMemberIntentInput,
  useLedgerSyncResultAcceptance,
} from "@features/platform-ledger-sync";
import {
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
  const { resultRef, accept } = useLedgerSyncResultAcceptance<true>();

  const onUserCancel = useCallback(
    () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances })),
    [dispatch],
  );

  useEffect(() => {
    if (!member) onUserCancel();
  }, [member, onUserCancel]);

  const onResult = useCallback(
    (newTrustchain: KeyRingTreeUpdate, runSession: KeyRingSession) => {
      accept(newTrustchain, runSession, true);
    },
    [accept],
  );

  const onJobStateChanged = useCallback(
    (jobState: RemoveMemberJobState) => {
      if (jobState.type === "completed") {
        if (!resultRef.current) return;
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
      } else if (jobState.type === "failed" && jobState.reason === "not-allowed") {
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.UnsecuredLedger }));
      } else if (jobState.type === "failed") {
        onError(jobState.error);
      }
    },
    [dispatch, onError, resultRef],
  );

  const createRunIntent =
    member && isMember && hasMemberKey
      ? (): RemoveMemberIntent =>
          createIntent(
            removeMemberIntentLWDDefinition,
            buildRemoveMemberIntentInput({ session, member, client }),
            {
              onResult: newTrustchain => onResult(newTrustchain, session),
              onJobStateChanged,
            },
          )
      : null;

  return { createRunIntent, onUserCancel };
}
