import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router";
import { Flex } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  saveSettings,
  setHasBeenUpsoldRecover,
  setHasRedirectedToPostOnboarding,
  setLastOnboardedDevice,
} from "~/renderer/actions/settings";
import StaxCompletionView from "./StaxCompletionView";
import EuropaCompletionView from "./EuropaCompletionView";
import ApexCompletionView from "./ApexCompletionView";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useRedirectToPostOnboardingCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsFlowName } from "../shared";

const COMPLETION_SCREEN_TIMEOUT = 6000;

function OnboardingSuccessView({ deviceModelId }: Readonly<{ deviceModelId: DeviceModelId }>) {
  switch (deviceModelId) {
    case DeviceModelId.stax:
      return <StaxCompletionView />;
    case DeviceModelId.europa:
      return <EuropaCompletionView />;
    case DeviceModelId.apex:
      return <ApexCompletionView />;
    default:
      return null;
  }
}

export default function CompletionScreen() {
  const dispatch = useDispatch();
  const history = useHistory();
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
  }, [currentDevice, dispatch, history, redirectToPostOnboarding]);

  return (
    <Flex alignItems="center" justifyContent="center" width="100%">
      <TrackPage
        category={`End of onboarding`}
        flow={analyticsFlowName}
        seedConfiguration={state?.seedConfiguration}
      />
      <OnboardingSuccessView deviceModelId={deviceModelId} />
    </Flex>
  );
}
