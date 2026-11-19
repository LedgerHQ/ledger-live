import { useCallback, useEffect, useRef, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  OnboardingStep,
  SeedPath,
  type HostOnboardingEvent,
} from "@features/platform-device-onboarding";
import {
  toChecksError,
  toChecksScreenState,
  toFirmwareUpdate,
} from "LLM/features/DeviceOnboarding/utils/checksPhase";
import { useSessionReconnect } from "@features/flow-device-onboarding-reconnect";
import { useConfirmSkipAfterUpdateScreen } from "@features/flow-device-onboarding-update-offer";
import { deviceLockedState } from "LLM/features/DeviceOnboarding/utils/deviceLocked";
import { toSetupStage, type SetupStage } from "../Setup/toSetupStage";
import type { SetupChecksProps, SetupScreenProps } from "../Setup/types";

const checksSucceededState = "checks.checksSucceeded";
const waitingState = "deviceSetup.waiting";
const restoreRecoverState = "deviceSetup.restoreRecover";
const restoreChoiceState = "deviceSetup.restoreChoice";
const droppedState = "awaitingSession";
const statesThatKeepTheStage = new Set([deviceLockedState, "readingState", droppedState]);
const statesThatAnswerTheUpdate = new Set([
  "checks.firmwareUpdateDelegated",
  "checks.checksDone",
  "checks.leavingEarlyCheckScreen",
  checksSucceededState,
]);

function rechecksTheUpdate(liveMachineState: string | null) {
  if (liveMachineState === null || statesThatAnswerTheUpdate.has(liveMachineState)) return false;
  return (
    liveMachineState.startsWith("checks.") ||
    liveMachineState === "routing" ||
    statesThatKeepTheStage.has(liveMachineState)
  );
}

const doneState = "done";

export type UnseededFunnelInput = {
  machineState: string | null;
  liveMachineState: string | null;
  onboardedOnEntry: boolean | null;
  currentStep: string | null;
  seedPath: string | null;
  /** The user already left the Recover pitch (skip, remind later, or back from Recover). */
  pastRecover: boolean;
  recoverAvailable: boolean;
  checksPaused: boolean;
  genuineFailureKind: string | null;
  deviceNotGenuine: boolean;
  firmwareVersion: string | null;
  availableFirmwareVersion: string | null;
  firmwareDeclined: boolean;
  /** How many times the user came back from the update screen without updating. */
  returnsWithoutUpdate: number;
  reportsRecoveryKey: boolean;
  device: Device | null;
  connectionError: string | null;
  suspendSheets: boolean;
  reconnect: () => void;
  send: (event: HostOnboardingEvent) => void;
  onQuit: () => void;
};

export type UnseededFunnelModel =
  | { status: "setup"; setup: SetupScreenProps }
  | { status: "recoverRestore"; dismiss: () => void }
  | { status: "recoverNewSeed" }
  | { status: "success"; sawRecoverPitch: boolean };

export function useUnseededFunnelViewModel(input: UnseededFunnelInput): UnseededFunnelModel | null {
  const { device, machineState, liveMachineState, send } = input;
  const [restoreDismissed, setRestoreDismissed] = useState(false);
  const dismissRestore = useCallback(() => setRestoreDismissed(true), []);
  if (restoreDismissed && machineState !== restoreRecoverState) setRestoreDismissed(false);

  const unseeded = input.onboardedOnEntry === false && device !== null && machineState !== null;
  const stageState =
    machineState === restoreRecoverState && restoreDismissed ? restoreChoiceState : machineState;
  const stage = unseeded
    ? toUnseededStage(device, stageState, input.currentStep, input.reportsRecoveryKey)
    : null;
  const holdsPrevious = unseeded && holdsPreviousStage(machineState, input.currentStep);

  const visibleStage = useHeldStage(stage, holdsPrevious);
  const connection = useSessionReconnect({
    dropped: unseeded && liveMachineState === droppedState && visibleStage !== null,
    error: input.connectionError,
    connect: input.reconnect,
  });
  useContinueChecks(unseeded, liveMachineState, send);
  const confirmSkipUpdate = useConfirmSkipAfterUpdateScreen({
    returnsWithoutUpdate: input.returnsWithoutUpdate,
    recheckingUpdate: unseeded && rechecksTheUpdate(liveMachineState),
  });

  if (unseeded && machineState === doneState) return toDoneModel(input);
  if (unseeded && machineState === restoreRecoverState && !restoreDismissed) {
    return { status: "recoverRestore", dismiss: dismissRestore };
  }
  if (!unseeded || !visibleStage || !device || !machineState) return null;

  return {
    status: "setup",
    setup: {
      device,
      stage: visibleStage,
      suspendSheets: input.suspendSheets,
      reportsRecoveryKey: input.reportsRecoveryKey,
      connection,
      firmwareDeclined: input.firmwareDeclined,
      checks: toChecks(input, machineState, confirmSkipUpdate),
      onQuit: input.onQuit,
    },
  };
}

function toUnseededStage(
  device: Device | null,
  machineState: string | null,
  currentStep: string | null,
  reportsRecoveryKey: boolean,
): SetupStage | null {
  if (!device || !machineState) return null;
  return toSetupStage({ machineState, currentStep, modelId: device.modelId, reportsRecoveryKey });
}

function holdsPreviousStage(machineState: string | null, currentStep: string | null): boolean {
  if (machineState === null) return false;
  const holdsDuringSafetyWarning =
    machineState.startsWith("deviceSetup.") && currentStep === OnboardingStep.SafetyWarning;
  return (
    machineState === waitingState ||
    holdsDuringSafetyWarning ||
    statesThatKeepTheStage.has(machineState)
  );
}

/** Keeps the last stage on screen while the machine passes through a transient state. */
function useHeldStage(stage: SetupStage | null, holdsPrevious: boolean): SetupStage | null {
  const [heldStage, setHeldStage] = useState<SetupStage | null>(null);

  if (stage && !sameStage(stage, heldStage)) setHeldStage(stage);
  else if (!stage && !holdsPrevious && heldStage) setHeldStage(null);

  return stage ?? (holdsPrevious ? heldStage : null);
}

/** Sends CONTINUE once per successful checks run, then re-arms when the run ends. */
function useContinueChecks(
  unseeded: boolean,
  liveMachineState: string | null,
  send: UnseededFunnelInput["send"],
) {
  const continuedChecks = useRef(false);

  useEffect(() => {
    if (!unseeded || liveMachineState !== checksSucceededState) {
      continuedChecks.current = false;
      return;
    }
    if (continuedChecks.current) return;
    continuedChecks.current = true;
    send({ type: "CONTINUE" });
  }, [liveMachineState, send, unseeded]);
}

function toDoneModel(
  input: Pick<UnseededFunnelInput, "seedPath" | "pastRecover" | "recoverAvailable">,
): UnseededFunnelModel | null {
  if (input.seedPath !== SeedPath.NewSeed) return null;
  if (!input.recoverAvailable) return { status: "success", sawRecoverPitch: false };
  if (!input.pastRecover) return { status: "recoverNewSeed" };
  return { status: "success", sawRecoverPitch: true };
}

function toChecks(
  input: UnseededFunnelInput,
  machineState: string,
  confirmSkipUpdate: boolean,
): SetupChecksProps | null {
  if (!machineState.startsWith("checks.")) return null;
  const state = toChecksScreenState(machineState, input.checksPaused, false);
  if (!state) return null;

  const send = input.send;
  return {
    state,
    error: toChecksError(machineState, input.genuineFailureKind),
    deviceNotGenuine: input.deviceNotGenuine,
    update: toFirmwareUpdate(input.firmwareVersion, input.availableFirmwareVersion),
    confirmSkipUpdate,
    onStart: () => send({ type: machineState === "checks.checksIdle" ? "RETRY" : "CONTINUE" }),
    onRetry: () => send({ type: "RETRY" }),
    onCloseSheet: () => send({ type: "CLOSE" }),
    onAcceptUpdate: () => send({ type: "USER_ACCEPT" }),
    onDeclineUpdate: () => send({ type: "USER_DECLINE" }),
  };
}

function sameStage(next: SetupStage, held: SetupStage | null) {
  return (
    held !== null &&
    held.kind === next.kind &&
    held.index === next.index &&
    held.total === next.total &&
    held.indicator === next.indicator &&
    held.detail === next.detail &&
    held.infoCard === next.infoCard
  );
}
