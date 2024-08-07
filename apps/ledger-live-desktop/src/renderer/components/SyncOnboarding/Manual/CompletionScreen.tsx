import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { saveSettings } from "~/renderer/actions/settings";

import StaxCompletionView from "./StaxCompletionView";
import EuropaCompletionView from "./EuropaCompletionView";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";

const GO_TO_POSTONBOARDING_TIMEOUT = 6000;

const CompletionScreen = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const currentDevice = useSelector(getCurrentDevice);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const device = currentDevice || lastSeenDevice;

  const handleInitPostOnboarding = useStartPostOnboardingCallback();

  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    const timeout = setTimeout(
      () =>
        handleInitPostOnboarding({
          deviceModelId: device?.modelId || DeviceModelId.nanoX,
          fallbackIfNoAction: () => history.push("/"),
        }),
      GO_TO_POSTONBOARDING_TIMEOUT,
    );
    return () => {
      clearTimeout(timeout);
    };
  }, [device?.modelId, dispatch, handleInitPostOnboarding, history]);

  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      {device?.modelId === DeviceModelId.stax ? (
        <StaxCompletionView />
      ) : device ? (
        <EuropaCompletionView device={device} />
      ) : null}
    </Flex>
  );
};

export default CompletionScreen;
