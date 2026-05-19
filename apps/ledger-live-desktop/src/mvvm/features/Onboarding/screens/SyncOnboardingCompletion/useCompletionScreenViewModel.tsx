import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useLocation, useNavigate } from "react-router";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  saveSettings,
  setHasBeenUpsoldRecover,
  setHasRedirectedToPostOnboarding,
  setLastOnboardedDevice,
} from "~/renderer/actions/settings";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useRedirectToPostOnboardingCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding";
import useFinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog";

const COMPLETION_SCREEN_TIMEOUT = 6000;

export interface ViewProps {
  seedConfiguration?: string;
  deviceModelId: DeviceModelId;
}

export function useCompletionScreenViewModel(): ViewProps {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { seedConfiguration?: string } | null;
  const currentDevice = useSelector(getCurrentDevice);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const deviceModelId = useMemo(() => {
    const device = currentDevice || lastSeenDevice;
    return device?.modelId || DeviceModelId.stax;
  }, [currentDevice, lastSeenDevice]);

  const { shouldDisplayFinishOnboardingWidget = false } = useWalletFeaturesConfig("desktop");
  const redirectToPostOnboarding = useRedirectToPostOnboardingCallback();
  const { handleOpen: openFinishOnboardingDialog } = useFinishOnboardingDialog();

  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    dispatch(setHasRedirectedToPostOnboarding(false));
    dispatch(setHasBeenUpsoldRecover(false));
    dispatch(setLastOnboardedDevice(currentDevice));
    const timeout = setTimeout(() => {
      if (shouldDisplayFinishOnboardingWidget) {
        navigate("/");
        openFinishOnboardingDialog();
      } else {
        redirectToPostOnboarding();
      }
    }, COMPLETION_SCREEN_TIMEOUT);
    return () => {
      clearTimeout(timeout);
    };
  }, [
    currentDevice,
    dispatch,
    navigate,
    openFinishOnboardingDialog,
    redirectToPostOnboarding,
    shouldDisplayFinishOnboardingWidget,
  ]);

  return {
    seedConfiguration: state?.seedConfiguration,
    deviceModelId,
  };
}
