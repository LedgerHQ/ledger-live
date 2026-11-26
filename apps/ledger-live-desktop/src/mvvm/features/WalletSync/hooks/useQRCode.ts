import { useCallback, useState } from "react";
import { selectHasKeyRingMemberKey, selectIsKeyRingMember } from "@domain/entity-key-ring";
import {
  classifyKeyRingError,
  commitKeyRingTree,
  KeyRingPairingClosedError,
  selectKeyRingSession,
  type KeyRingSession,
} from "@features/platform-key-ring";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
import { setDrawerVisibility, setFlow, setQrCodePinCode } from "~/renderer/actions/walletSync";
import { Flow, Step, walletSyncStepSelector } from "~/renderer/reducers/walletSync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { track } from "@shared/analytics";
import { QueryKey } from "./type.hooks";
import { useInstanceName } from "./useInstanceName";
import {
  AnalyticsFlow,
  AnalyticsPage,
  walletSyncEntryFlowProperties,
} from "./useLedgerSyncAnalytics";
import { saveSettings } from "~/renderer/actions/settings";
import { useNavigate } from "react-router";

const MIN_TIME_TO_REFRESH = 30_000;

export function useQRCode({ sourcePage }: { sourcePage?: AnalyticsPage }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const session = useSelector(selectKeyRingSession);
  const isMember = useSelector(selectIsKeyRingMember);
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const store = useStore();
  const sdk = useKeyRingClient();
  const [url, setUrl] = useState<string | null>(null);
  const memberName = useInstanceName();

  const goToActivation = useCallback(() => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  }, [dispatch]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (runSession: KeyRingSession) =>
      sdk.hostPairing(runSession, {
        memberName,
        onDisplayQRCode: url => {
          setUrl(url);
        },
        onDisplayDigits: digits => {
          dispatch(setQrCodePinCode(digits));
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCode }));
        },
      }),

    // Don't use retry here because it always uses a delay despite setting it to 0
    onError(e) {
      switch (classifyKeyRingError(e)) {
        case "pairing-closed": {
          const time = e instanceof KeyRingPairingClosedError ? e.elapsedMs : undefined;
          if (time !== undefined && time >= MIN_TIME_TO_REFRESH) startQRCodeProcessing();
          break;
        }
        case "pairing-invalid-code":
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCodeError }));
          break;
        case "pairing-protocol":
          if (walletSyncStepSelector(store.getState()) === Step.SynchronizeWithQRCode) {
            startQRCodeProcessing();
          } else {
            dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }));
          }
          break;
        case "no-tree-for-seed":
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.UnbackedError }));
          break;
        case "already-member":
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }));
          break;
      }
    },

    onSuccess(newTrustchain) {
      if (newTrustchain) {
        dispatch(commitKeyRingTree(newTrustchain));
        if (!isMember) {
          track("ledgersync_activated", walletSyncEntryFlowProperties(AnalyticsFlow));
        }
      }
      if (sourcePage === AnalyticsPage.Onboarding) {
        dispatch(saveSettings({ hasCompletedOnboarding: true }));
        navigate("/");
        dispatch(setDrawerVisibility(false));
      } else {
        dispatch(
          setFlow({
            flow: Flow.Synchronize,
            step: Step.SynchronizeLoading,
            nextStep: Step.Synchronized,
            hasTrustchainBeenCreated: false,
          }),
        );
      }
      queryClient.invalidateQueries({ queryKey: [QueryKey.getMembers] });
      setUrl(null);
      dispatch(setQrCodePinCode(null));
    },
  });

  const startQRCodeProcessing = useCallback(() => {
    if (hasMemberKey) mutate(session);
  }, [mutate, hasMemberKey, session]);

  return {
    url,
    error,
    isLoading: isPending,
    startQRCodeProcessing,
    goToActivation,
  };
}
