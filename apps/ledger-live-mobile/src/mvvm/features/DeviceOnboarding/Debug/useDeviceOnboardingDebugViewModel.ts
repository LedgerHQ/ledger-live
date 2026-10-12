import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";

const previewDevice = {
  deviceId: "preview",
  deviceName: "Lily's Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

export function useDeviceOnboardingDebugViewModel() {
  const navigation = useNavigation();
  const [state, setState] = useState<ChecksScreenState>("idle");
  const [isScreenOpen, setIsScreenOpen] = useState(true);

  const screenProps: ChecksScreenProps = {
    device: previewDevice,
    state,
    error: null,
    update: null,
    onStart: () => setState("checking"),
    onRetry: () => undefined,
    onAcceptUpdate: () => setState("checking"),
    onDeclineUpdate: () => setState("checking"),
    onCloseSheet: () => setState("checking"),
    onContinue: () => setState("idle"),
    onQuit: () => {
      setState("idle");
      setIsScreenOpen(false);
    },
  };

  return {
    state,
    isScreenOpen,
    onSelectState: (next: ChecksScreenState) => {
      setState(next);
      setIsScreenOpen(true);
    },
    onBack: () => navigation.goBack(),
    screenProps,
  };
}
