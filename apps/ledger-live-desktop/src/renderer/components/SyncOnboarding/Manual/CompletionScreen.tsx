import React, { useEffect, useContext } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch, useSelector } from "react-redux";

import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import ConnectNano from "../../Onboarding/Screens/Tutorial/assets/connectNano.png";
import Image from "~/renderer/components/Image";
import { saveSettings } from "~/renderer/actions/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";

const GO_TO_POSTONBOARDING_TIMEOUT = 5000;

const CompletionScreen = () => {
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);

  const device = useSelector(getCurrentDevice);
  const handleInitPostOnboarding = useStartPostOnboardingCallback(device?.modelId, true);

  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    setTimeout(() => handleInitPostOnboarding(), GO_TO_POSTONBOARDING_TIMEOUT);
  }, [dispatch, handleInitPostOnboarding]);

  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      <DeviceIllustration deviceId={device?.modelId || "nanoX"} />
    </Flex>
  );
};

export default CompletionScreen;
