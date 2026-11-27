import { useCallback, useRef } from "react";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import { selectHasKeyRingMemberKey } from "@domain/entity-key-ring";
import {
  buildAddMemberIntentInput,
  trackLedgerSyncActivated,
  useLedgerSyncResultAcceptance,
} from "@features/platform-ledger-sync";
import {
  selectKeyRingSession,
  type AddMemberIntent,
  type AddMemberIntentInput,
  type AddMemberJobState,
  type KeyRingActivation,
  type KeyRingSession,
} from "@features/platform-key-ring";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import {
  AnalyticsFlow,
  walletSyncEntryFlowProperties,
  type AnalyticsPage,
} from "../../hooks/useLedgerSyncAnalytics";
import { useLeaveDeviceStepOnTrustchainJoined } from "../../hooks/useOnTrustchainJoined";
import { toLegacyDevice } from "../toLegacyDevice";
import { useKeyRingClient } from "../../hooks/useKeyRingClient";
import { addMemberIntentLWDDefinition } from "./intentLWDDefinition";

/**
 * Adds this instance to the trustchain of the device seed on DIE, then leaves the device step
 * the way the legacy `CreateOrSynchronizeTrustChain` step does.
 */
export function useAddMemberIntentStep(sourcePage: AnalyticsPage, onError: (error: Error) => void) {
  const dispatch = useDispatch();
  const client = useKeyRingClient();
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const session = useSelector(selectKeyRingSession);
  const leaveDeviceStep = useLeaveDeviceStepOnTrustchainJoined(sourcePage);
  const deviceRef = useRef<Device | null>(null);
  const { resultRef, accept } = useLedgerSyncResultAcceptance<KeyRingActivation>();

  const onResult = useCallback(
    (result: KeyRingActivation, runSession: KeyRingSession) => {
      accept(result.tree, runSession, result, () =>
        trackLedgerSyncActivated(walletSyncEntryFlowProperties(AnalyticsFlow)),
      );
    },
    [accept],
  );

  const onJobStateChanged = useCallback(
    (jobState: AddMemberJobState) => {
      if (jobState.type === "completed" && resultRef.current) {
        leaveDeviceStep(resultRef.current, deviceRef.current);
        return;
      }
      if (jobState.type !== "failed") return;
      switch (jobState.reason) {
        case "already-secured-same-seed":
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.AlreadySecuredSameSeed }));
          break;
        case "already-secured-other-seed":
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.AlreadySecuredOtherSeed }));
          break;
        case "no-trustchain":
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.UnbackedError }));
          break;
        case "device-unsupported":
        default:
          onError(jobState.error);
      }
    },
    [dispatch, onError, leaveDeviceStep, resultRef],
  );

  const createRunIntent = hasMemberKey
    ? (): AddMemberIntent =>
        createIntent<AddMemberJobState, AddMemberIntentInput, undefined, KeyRingActivation>(
          addMemberIntentLWDDefinition,
          buildAddMemberIntentInput({ session, client }),
          { onResult: result => onResult(result, session), onJobStateChanged },
        )
    : null;

  const onExecutorStateChanged = useCallback((executorState: ExecutorState) => {
    if ("connectionResult" in executorState) {
      deviceRef.current = toLegacyDevice(executorState.connectionResult);
    }
  }, []);

  const onUserCancel = useCallback(
    () => dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize })),
    [dispatch],
  );

  return { createRunIntent, onExecutorStateChanged, onUserCancel };
}
