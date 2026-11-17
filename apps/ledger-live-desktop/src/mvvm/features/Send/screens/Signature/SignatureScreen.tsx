import React, { useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { SignatureDeviceActionScreen } from "./SignatureDeviceActionScreen";
import { SignatureExecutorScreen } from "./SignatureExecutorScreen";

export const SignatureScreen = () => {
  const isDeviceIntentEnabled = useFeature("lwdNewSendFlowDeviceIntent")?.enabled === true;
  // A flag update mid-signature would remount the other screen and sign a second time.
  const [isDeviceIntentEnabledOnMount] = useState(isDeviceIntentEnabled);

  return isDeviceIntentEnabledOnMount ? (
    <SignatureExecutorScreen />
  ) : (
    <SignatureDeviceActionScreen />
  );
};
