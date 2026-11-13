import { useCallback, useRef } from "react";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import type {
  AddMemberIntent,
  AddMemberIntentInput,
  AddMemberJobState,
} from "@features/platform-intent-wallet-sync";
import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import type { TrustchainResult } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import type { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { useOnTrustchainJoined } from "../../hooks/useOnTrustchainJoined";
import { toLegacyDevice } from "../toLegacyDevice";
import { useCreateSessionSdk } from "../useCreateSessionSdk";
import { addMemberIntentLWDDefinition } from "./intentLWDDefinition";

/**
 * Adds this instance to the trustchain of the device seed on DIE, then leaves the device step
 * the way the legacy `CreateOrSynchronizeTrustChain` step does.
 */
export function useAddMemberIntentStep(sourcePage: AnalyticsPage, onError: (error: Error) => void) {
  const dispatch = useDispatch();
  const createSessionSdk = useCreateSessionSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const trustchain = useSelector(trustchainSelector);
  const onTrustchainJoined = useOnTrustchainJoined(sourcePage);
  const deviceRef = useRef<Device | null>(null);
  const resultRef = useRef<TrustchainResult | null>(null);

  const onResult = useCallback(
    (result: TrustchainResult) => {
      resultRef.current = result;
      dispatch(setTrustchain(result.trustchain));
    },
    [dispatch],
  );

  const onJobStateChanged = useCallback(
    (jobState: AddMemberJobState) => {
      if (jobState.type === "completed" && resultRef.current) {
        onTrustchainJoined(resultRef.current, deviceRef.current);
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
        default:
          onError(jobState.error);
      }
    },
    [dispatch, onError, onTrustchainJoined],
  );

  const createRunIntent = memberCredentials
    ? (): AddMemberIntent =>
        createIntent<AddMemberJobState, AddMemberIntentInput, undefined, TrustchainResult>(
          addMemberIntentLWDDefinition,
          { memberCredentials, currentTrustchain: trustchain ?? undefined, createSessionSdk },
          { onResult, onJobStateChanged },
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
