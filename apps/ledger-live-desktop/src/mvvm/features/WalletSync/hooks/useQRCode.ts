import { useCallback } from "react";
import { useLedgerSyncPairingHost } from "@features/flow-ledger-sync";
import { useDispatch, useStore } from "LLD/hooks/redux";
import { setDrawerVisibility, setFlow, setQrCodePinCode } from "~/renderer/actions/walletSync";
import { Flow, Step, walletSyncStepSelector } from "~/renderer/reducers/walletSync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useInstanceName } from "./useInstanceName";
import {
  AnalyticsFlow,
  AnalyticsPage,
  walletSyncEntryFlowProperties,
} from "./useLedgerSyncAnalytics";
import { saveSettings } from "~/renderer/actions/settings";
import { useNavigate } from "react-router";

export function useQRCode({ sourcePage }: { sourcePage?: AnalyticsPage }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useStore();
  const client = useKeyRingClient();
  const memberName = useInstanceName();

  const goToActivation = useCallback(() => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  }, [dispatch]);

  const { url, error, isLoading, start } = useLedgerSyncPairingHost({
    client,
    memberName,
    startBinding: "session",
    notifyPaired: "before-members-refresh",
    onDisplayDigits: digits => {
      dispatch(setQrCodePinCode(digits));
      dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCode }));
    },
    onPaired: () => {
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
    },
    onDigitsCleared: () => dispatch(setQrCodePinCode(null)),
    getActivatedEventProperties: () => walletSyncEntryFlowProperties(AnalyticsFlow),
    onFailure: ({ category, restart }) => {
      switch (category) {
        case "pairing-invalid-code":
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCodeError }));
          break;
        case "pairing-protocol":
          if (walletSyncStepSelector(store.getState()) === Step.SynchronizeWithQRCode) {
            restart();
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
  });

  return {
    url,
    error,
    isLoading,
    startQRCodeProcessing: start,
    goToActivation,
  };
}
