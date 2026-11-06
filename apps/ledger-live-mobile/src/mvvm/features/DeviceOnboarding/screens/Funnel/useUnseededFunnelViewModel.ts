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

type UnseededSetupProps = Omit<SetupScreenProps, "leaveRequest">;

const checksSucceededState = "checks.checksSucceeded";
const firmwareUpdateDelegatedState = "checks.firmwareUpdateDelegated";
const waitingState = "deviceSetup.waiting";
const statesThatKeepTheStage = new Set(["deviceLocked", "readingState"]);

export type UnseededFunnelInput = {
  machineState: string | null;
  onboardedOnEntry: boolean | null;
  currentStep: string | null;
  checksPaused: boolean;
  genuineFailureKind: string | null;
  firmwareVersion: string | null;
  availableFirmwareVersion: string | null;
  device: Device | null;
  firmwareUpToDate: boolean;
  send: (event: HostOnboardingEvent) => void;
  closeFirmwareHandover: () => void;
};

export function useUnseededFunnelViewModel(
  input: UnseededFunnelInput,
): { status: "setup"; setup: UnseededSetupProps } | null {
  const [heldStage, setHeldStage] = useState<SetupStage | null>(null);
  const continuedChecks = useRef(false);
  const quitSent = useRef(false);
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

  useEffect(() => {
    if (!unseeded || machineState !== checksSucceededState) {
      continuedChecks.current = false;
      return;
    }
    if (continuedChecks.current) return;
    continuedChecks.current = true;
    send({ type: "CONTINUE" });
  }, [machineState, send, unseeded]);

  if (!unseeded || !visibleStage || !device || !machineState) return null;

  const checksState = machineState.startsWith("checks.")
    ? toChecksScreenState(machineState, input.checksPaused, false)
    : null;

  return {
    status: "setup",
    setup: {
      device,
      stage: visibleStage,
      firmwareUpToDate: input.firmwareUpToDate,
      checks: checksState
        ? {
            state: checksState,
            error: toChecksError(machineState, input.genuineFailureKind),
            update: toFirmwareUpdate(input.firmwareVersion, input.availableFirmwareVersion),
            onStart: () =>
              send({ type: machineState === "checks.checksIdle" ? "RETRY" : "CONTINUE" }),
            onRetry: () => send({ type: "RETRY" }),
            onCloseSheet: () => send({ type: "CLOSE" }),
            onAcceptUpdate: () => send({ type: "USER_ACCEPT" }),
            onDeclineUpdate: () => send({ type: "USER_DECLINE" }),
            onCloseFirmwareOffer: () => send({ type: "CLOSE" }),
          }
        : null,
      onLeave: () => {
        if (quitSent.current) return;
        quitSent.current = true;
        if (machineState === firmwareUpdateDelegatedState) input.closeFirmwareHandover();
        send({ type: "QUIT" });
      },
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
