import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import { SignatureExecutorScreen } from "./SignatureExecutorScreen";
import { SignatureDeviceActionScreen } from "./SignatureDeviceActionScreen";

export function SignatureScreen() {
  const useDeviceActionSignature = useFeature("useDeviceActionSignatureSend")?.enabled ?? false;

  return useDeviceActionSignature ? <SignatureDeviceActionScreen /> : <SignatureExecutorScreen />;
}
