import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLocation } from "react-router";
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

const COMPLETION_SCREEN_TIMEOUT = 6000;

export interface ViewProps {
  seedConfiguration?: string;
  deviceModelId: DeviceModelId;
}

export function useCompletionScreenViewModel(): ViewProps {
  const dispatch = useDispatch();
  const { state } = useLocation<{ seedConfiguration?: string }>();
  const currentDevice = useSelector(getCurrentDevice);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const deviceModelId = useMemo(() => {
    const device = currentDevice || lastSeenDevice;
    return device?.modelId || DeviceModelId.stax;
  }, [currentDevice, lastSeenDevice]);

  const redirectToPostOnboarding = useRedirectToPostOnboardingCallback();

  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    dispatch(setHasRedirectedToPostOnboarding(false));
    dispatch(setHasBeenUpsoldRecover(false));
    dispatch(setLastOnboardedDevice(currentDevice));
    const timeout = setTimeout(redirectToPostOnboarding, COMPLETION_SCREEN_TIMEOUT);
    return () => {
      clearTimeout(timeout);
    };
  }, [currentDevice, dispatch, redirectToPostOnboarding]);

  return {
    seedConfiguration: state.seedConfiguration,
    deviceModelId,
  };
}
