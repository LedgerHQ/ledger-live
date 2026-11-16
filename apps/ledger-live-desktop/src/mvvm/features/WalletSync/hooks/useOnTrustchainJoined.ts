import { useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { track } from "@shared/analytics";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { TrustchainResult, TrustchainResultType } from "@ledgerhq/ledger-key-ring-protocol/types";
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
 * Leaves the device step once this instance joined the trustchain: tracks the activation, then
 * ends the onboarding or moves the activation flow to its final step.
 */
export function useOnTrustchainJoined(sourcePage?: AnalyticsPage) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOnboardingNewDevice = useSelector(walletSyncOnboardingNewDeviceSelector);
  const isOnboardingNewDeviceInitial = useRef(isOnboardingNewDevice);

  return useCallback(
    (trustchainResult: TrustchainResult, device: Device | null) => {
      track("ledgersync_activated", walletSyncEntryFlowProperties(AnalyticsFlow));
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
              trustchainResult.type === TrustchainResultType.created
                ? Step.ActivationFinal
                : Step.SynchronizationFinal,
            hasTrustchainBeenCreated: trustchainResult.type === TrustchainResultType.created,
          }),
        );
      }
    },
    [dispatch, navigate, sourcePage],
  );
}
