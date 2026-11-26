import { useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { trackLedgerSyncActivated } from "@features/platform-ledger-sync";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { KeyRingActivation } from "@features/platform-key-ring";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { saveSettings, setLastOnboardedDevice } from "~/renderer/actions/settings";
import { Flow, Step, walletSyncOnboardingNewDeviceSelector } from "~/renderer/reducers/walletSync";
import {
  AnalyticsFlow,
  AnalyticsPage,
  walletSyncEntryFlowProperties,
} from "./useLedgerSyncAnalytics";

/**
 * Leaves the device step once this instance joined the trustchain: ends the onboarding or moves
 * the activation flow to its final step.
 */
export function useLeaveDeviceStepOnTrustchainJoined(sourcePage?: AnalyticsPage) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOnboardingNewDevice = useSelector(walletSyncOnboardingNewDeviceSelector);
  const isOnboardingNewDeviceInitial = useRef(isOnboardingNewDevice);

  return useCallback(
    (activation: KeyRingActivation, device: Device | null) => {
      if (sourcePage === AnalyticsPage.Onboarding) {
        if (!isOnboardingNewDeviceInitial.current) {
          dispatch(saveSettings({ hasCompletedOnboarding: true }));
          dispatch(setLastOnboardedDevice(device));
          navigate("/");
        }
        dispatch(setDrawerVisibility(false));
      } else {
        dispatch(
          setFlow({
            flow: Flow.Activation,
            step: Step.ActivationLoading,
            nextStep:
              activation.outcome === "created" ? Step.ActivationFinal : Step.SynchronizationFinal,
            hasTrustchainBeenCreated: activation.outcome === "created",
          }),
        );
      }
    },
    [dispatch, navigate, sourcePage],
  );
}

/** Tracks the activation, then leaves the device step. */
export function useOnTrustchainJoined(sourcePage?: AnalyticsPage) {
  const leaveDeviceStep = useLeaveDeviceStepOnTrustchainJoined(sourcePage);

  return useCallback(
    (activation: KeyRingActivation, device: Device | null) => {
      trackLedgerSyncActivated(walletSyncEntryFlowProperties(AnalyticsFlow));
      leaveDeviceStep(activation, device);
    },
    [leaveDeviceStep],
  );
}
