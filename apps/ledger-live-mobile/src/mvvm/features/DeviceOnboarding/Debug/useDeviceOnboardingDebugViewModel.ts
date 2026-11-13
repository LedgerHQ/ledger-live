import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type {
  ChecksScreenProps,
  ChecksScreenState,
  GenuineErrorKind,
} from "LLM/features/DeviceOnboarding/types";

const screenPreviews = new Set<string>(["offer", "unseededIntro", "recoverCopy1", "recoverCopy2"]);
const errorPreviews = new Set<string>(["declined", "notGenuine", "provider", "network", "unknown"]);

export type DeviceOnboardingPreview =
  | ChecksScreenState
  | "offer"
  | "unseededIntro"
  | "recoverCopy1"
  | "recoverCopy2"
  | GenuineErrorKind;

function isScreenPreview(
  preview: DeviceOnboardingPreview,
): preview is "offer" | "unseededIntro" | "recoverCopy1" | "recoverCopy2" {
  return screenPreviews.has(preview);
}

function isErrorPreview(preview: DeviceOnboardingPreview): preview is GenuineErrorKind {
  return errorPreviews.has(preview);
}

function checksStateForPreview(preview: DeviceOnboardingPreview): ChecksScreenState {
  if (isScreenPreview(preview)) return "idle";
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
    firmwareUpToDate: true,
    onStart: () => setPreview("checking"),
    onRetry: () => setPreview("checking"),
    onAcceptUpdate: () => setPreview("checking"),
    onDeclineUpdate: () => setPreview("checking"),
    onCloseSheet: () => setPreview("checking"),
    onContinue: () => setPreview("offer"),
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
    onClosePreview: closePreview,
    syncOfferProps: {
      onActivate: () => undefined,
      onSkip: () => undefined,
      onLearnMore: () => undefined,
      onQuit: closePreview,
      onContinue: () => undefined,
      phase: "offer" as const,
    },
  };
}
