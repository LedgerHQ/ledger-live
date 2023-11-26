import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { saveSettings } from "~/renderer/actions/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useTheme } from "styled-components";

import CompletedOnboardingDark from "./assets/completeOnboardingDark.mp4";
import CompletedOnboardingLight from "./assets/completeOnboardingLight.mp4";

const GO_TO_POSTONBOARDING_TIMEOUT = 6000;

const videos = {
  dark: CompletedOnboardingDark,
  light: CompletedOnboardingLight,
};

const CompletionScreen = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const device = useSelector(getCurrentDevice);

  const handleInitPostOnboarding = useStartPostOnboardingCallback();

  const { colors } = useTheme();
  const palette = colors.palette.type;

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
      <Flex height={"100vh"}>
        <video autoPlay loop height="100%">
          <source src={videos[palette]} type="video/mp4" />
        </video>
      </Flex>
    </Flex>
  );
};

export default CompletionScreen;
