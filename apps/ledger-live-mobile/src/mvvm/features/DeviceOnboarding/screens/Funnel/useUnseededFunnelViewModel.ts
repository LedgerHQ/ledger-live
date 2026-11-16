import { useEffect, useRef, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { OnboardingStep, type HostOnboardingEvent } from "@features/platform-device-onboarding";
import {
  toChecksError,
  toChecksScreenState,
  toFirmwareUpdate,
} from "LLM/features/DeviceOnboarding/utils/checksPhase";
import { toSetupStage, type SetupStage } from "../Setup/toSetupStage";
import type { SetupScreenProps } from "../Setup/types";

const checksSucceededState = "checks.checksSucceeded";
const waitingState = "deviceSetup.waiting";
const statesThatKeepTheStage = new Set(["deviceLocked", "readingState"]);

export type UnseededFunnelInput = {
  machineState: string | null;
  liveMachineState: string | null;
  onboardedOnEntry: boolean | null;
  currentStep: string | null;
  checksPaused: boolean;
  genuineFailureKind: string | null;
  deviceNotGenuine: boolean;
  firmwareVersion: string | null;
  availableFirmwareVersion: string | null;
  device: Device | null;
  suspendSheets: boolean;
  send: (event: HostOnboardingEvent) => void;
  onQuit: () => void;
};

export function useUnseededFunnelViewModel(
  input: UnseededFunnelInput,
): { status: "setup"; setup: SetupScreenProps } | null {
  const [heldStage, setHeldStage] = useState<SetupStage | null>(null);
  const continuedChecks = useRef(false);
  const device = input.device;
  const machineState = input.machineState;
  const unseeded = input.onboardedOnEntry === false && device !== null && machineState !== null;
  const stage =
    unseeded && device && machineState
      ? toSetupStage({
          machineState,
          currentStep: input.currentStep,
          modelId: device.modelId,
        })
      : null;
  const holdsDuringSafetyWarning =
    machineState?.startsWith("deviceSetup.") === true &&
    input.currentStep === OnboardingStep.SafetyWarning;
  const keepsStage = machineState !== null && statesThatKeepTheStage.has(machineState);
  const holdsPrevious =
    unseeded && (machineState === waitingState || holdsDuringSafetyWarning || keepsStage);

  if (stage && !sameStage(stage, heldStage)) setHeldStage(stage);
  else if (!stage && !holdsPrevious && heldStage) setHeldStage(null);

  const visibleStage = stage ?? (holdsPrevious ? heldStage : null);
  const send = input.send;

  const liveMachineState = input.liveMachineState;

  useEffect(() => {
    if (!unseeded || liveMachineState !== checksSucceededState) {
      continuedChecks.current = false;
      return;
    }
    if (continuedChecks.current) return;
    continuedChecks.current = true;
    send({ type: "CONTINUE" });
  }, [liveMachineState, send, unseeded]);

  if (!unseeded || !visibleStage || !device || !machineState) return null;

  const checksState = machineState.startsWith("checks.")
    ? toChecksScreenState(machineState, input.checksPaused, false)
    : null;

  return {
    status: "setup",
    setup: {
      device,
      stage: visibleStage,
      suspendSheets: input.suspendSheets,
      checks: checksState
        ? {
            state: checksState,
            error: toChecksError(machineState, input.genuineFailureKind),
            deviceNotGenuine: input.deviceNotGenuine,
            update: toFirmwareUpdate(input.firmwareVersion, input.availableFirmwareVersion),
            onStart: () =>
              send({ type: machineState === "checks.checksIdle" ? "RETRY" : "CONTINUE" }),
            onRetry: () => send({ type: "RETRY" }),
            onCloseSheet: () => send({ type: "CLOSE" }),
            onAcceptUpdate: () => send({ type: "USER_ACCEPT" }),
            onDeclineUpdate: () => send({ type: "USER_DECLINE" }),
          }
        : null,
      onQuit: input.onQuit,
    },
  };
}

function sameStage(next: SetupStage, held: SetupStage | null) {
  return (
    held !== null &&
    held.kind === next.kind &&
    held.index === next.index &&
    held.total === next.total &&
    held.indicator === next.indicator &&
    held.detail === next.detail
  );
}
