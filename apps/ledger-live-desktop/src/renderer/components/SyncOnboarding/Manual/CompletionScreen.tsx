import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch, useSelector } from "react-redux";
import { DeviceModelId } from "@ledgerhq/devices";
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
import { useHistory } from "react-router";
import { useRedirectToPostOnboardingCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding";

const COMPLETION_SCREEN_TIMEOUT = 6000;

const CompletionScreen = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const currentDevice = useSelector(getCurrentDevice);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const device = currentDevice || lastSeenDevice;

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

  const onboardingSuccessView = () => {
    switch (device?.modelId) {
      case DeviceModelId.stax:
        return <StaxCompletionView />;
      case DeviceModelId.europa:
        return <EuropaCompletionView />;
      case DeviceModelId.apex:
        return <ApexCompletionView />;
      default:
        return null;
    }
  };

  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      {onboardingSuccessView()}
    </Flex>
  );
};

export default CompletionScreen;
