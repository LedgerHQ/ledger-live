import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";

import ConnectNano from "../../Onboarding/Screens/Tutorial/assets/connectNano.png";
import Image from "~/renderer/components/Image";
import { saveSettings } from "~/renderer/actions/settings";

const GO_TO_HOMEPAGE_TIMEOUT = 5000;

const CompletionScreen = () => {
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    setTimeout(() => history.push("/"), GO_TO_HOMEPAGE_TIMEOUT);
  }, [history, dispatch]);

  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      <Image resource={ConnectNano} alt="" width={350} height={350} />
    </Flex>
  );
};

export default CompletionScreen;
