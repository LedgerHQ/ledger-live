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
  const [preview, setPreview] = useState<ChecksScreenState | "offer">("idle");
  const [isScreenOpen, setIsScreenOpen] = useState(true);

  const closePreview = () => {
    setPreview("idle");
    setIsScreenOpen(false);
  };

  const screenProps: ChecksScreenProps = {
    device: previewDevice,
    state: preview === "offer" ? "idle" : preview,
    error: null,
    update: null,
    onStart: () => setPreview("checking"),
    onRetry: () => undefined,
    onAcceptUpdate: () => setPreview("checking"),
    onDeclineUpdate: () => setPreview("checking"),
    onCloseSheet: () => setPreview("checking"),
    onContinue: () => setPreview("idle"),
    onQuit: closePreview,
  };

  return {
    preview,
    isScreenOpen,
    onSelectPreview: (next: ChecksScreenState | "offer") => {
      setPreview(next);
      setIsScreenOpen(true);
    },
    onBack: () => navigation.goBack(),
    screenProps,
    offerProps: {
      onActivate: () => undefined,
      onSkip: () => undefined,
      onLearnMore: () => undefined,
      onQuit: closePreview,
    },
  };
}
