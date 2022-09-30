import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch, useSelector } from "react-redux";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import DeviceIllustration from "~/renderer/components/DeviceIllustration";
import { saveSettings } from "~/renderer/actions/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";

const GO_TO_POSTONBOARDING_TIMEOUT = 5000;

const CompletionScreen = () => {
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);

  const handleInitPostOnboarding = useStartPostOnboardingCallback(
    device?.modelId || DeviceModelId.nanoX,
    true,
  );

  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    const timeout = setTimeout(handleInitPostOnboarding, GO_TO_POSTONBOARDING_TIMEOUT);
    return () => {
      clearTimeout(timeout);
    };
  }, [dispatch, handleInitPostOnboarding]);

  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      <DeviceIllustration deviceId={device?.modelId || DeviceModelId.nanoX} />
    </Flex>
  );
};

export default CompletionScreen;
