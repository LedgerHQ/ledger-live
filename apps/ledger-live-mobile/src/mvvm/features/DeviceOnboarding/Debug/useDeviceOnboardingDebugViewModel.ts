import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type {
  ChecksScreenProps,
  ChecksScreenState,
  GenuineErrorKind,
} from "LLM/features/DeviceOnboarding/types";

const errorPreviews = new Set<string>(["declined", "notGenuine", "provider", "network", "unknown"]);

export type DeviceOnboardingPreview = ChecksScreenState | "offer" | GenuineErrorKind;

function isErrorPreview(preview: DeviceOnboardingPreview): preview is GenuineErrorKind {
  return errorPreviews.has(preview);
}

function checksStateForPreview(preview: DeviceOnboardingPreview): ChecksScreenState {
  if (preview === "offer") return "idle";
  if (isErrorPreview(preview)) return "checking";
  return preview;
}

const previewDevice = {
  deviceId: "preview",
  deviceName: "Lily's Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

export function useDeviceOnboardingDebugViewModel() {
  const navigation = useNavigation();
  const [preview, setPreview] = useState<DeviceOnboardingPreview>("idle");
  const [isScreenOpen, setIsScreenOpen] = useState(true);

  const closePreview = () => {
    setPreview("idle");
    setIsScreenOpen(false);
  };

  const screenProps: ChecksScreenProps = {
    device: previewDevice,
    state: checksStateForPreview(preview),
    error: isErrorPreview(preview) ? { kind: preview } : null,
    update: preview === "updating" ? { current: "1.0.0", available: "1.1.0" } : null,
    onStart: () => setPreview("checking"),
    onRetry: () => setPreview("checking"),
    onAcceptUpdate: () => setPreview("checking"),
    onDeclineUpdate: () => setPreview("checking"),
    onCloseSheet: () => setPreview("checking"),
    onQuit: closePreview,
  };

  return {
    preview,
    isScreenOpen,
    onSelectPreview: (next: DeviceOnboardingPreview) => {
      setPreview(next);
      setIsScreenOpen(true);
    },
    onBack: () => navigation.goBack(),
    screenProps,
    syncOfferProps: {
      onActivate: () => undefined,
      onSkip: () => undefined,
      onLearnMore: () => undefined,
      onQuit: closePreview,
    },
  };
}
