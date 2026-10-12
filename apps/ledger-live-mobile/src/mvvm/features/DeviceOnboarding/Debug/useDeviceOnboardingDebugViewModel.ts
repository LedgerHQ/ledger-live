import { useState } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";

const previewDevice = {
  deviceId: "preview",
  modelId: DeviceModelId.stax,
  wired: false,
};

export function useDeviceOnboardingDebugViewModel() {
  const [state, setState] = useState<ChecksScreenState>("idle");

  const screenProps: ChecksScreenProps = {
    device: previewDevice,
    state,
    error: null,
    update: null,
    onStart: () => setState("checking"),
    onRetry: () => undefined,
    onAcceptUpdate: () => undefined,
    onDeclineUpdate: () => undefined,
    onCloseSheet: () => setState("checking"),
    onContinue: () => setState("idle"),
    onQuit: () => setState("idle"),
  };

  return { state, onSelectState: setState, screenProps };
}
