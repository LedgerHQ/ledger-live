import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { saveSettings } from "~/renderer/actions/settings";
import DeviceIllustration from "~/renderer/components/DeviceIllustration";
import { getCurrentDevice } from "~/renderer/reducers/devices";

const GO_TO_POSTONBOARDING_TIMEOUT = 5000;

const CompletionScreen = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);

  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    // TODO: replace with this one when post onboarding is ready
    // setTimeout(
    //   () => history.push("/onboarding/sync/post-onboarding"),
    //   GO_TO_POSTONBOARDING_TIMEOUT,
    // );
    setTimeout(() => history.push("/"), GO_TO_POSTONBOARDING_TIMEOUT);
  }, [history, dispatch]);

  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      <DeviceIllustration deviceId={device?.modelId || "nanoX"} />
    </Flex>
  );
};

export default CompletionScreen;
