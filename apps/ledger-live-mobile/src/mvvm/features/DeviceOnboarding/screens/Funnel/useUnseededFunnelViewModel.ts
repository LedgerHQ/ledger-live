import { useCallback, useEffect, useRef, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { FunnelProps } from "@features/platform-device-onboarding-analytics";
import {
  asChecksState,
  isFirmwareCheckFailed,
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
import { toSetupStage } from "@features/flow-device-onboarding-setup-stage";
import { toSetupInfoCard } from "@features/flow-device-onboarding-setup-info";
import type { SetupChecksProps, SetupScreenProps, SetupScreenStage } from "../Setup/types";

const checksSucceededState = "checks.checksSucceeded";
const waitingState = "deviceSetup.waiting";
const restoreRecoverState = "deviceSetup.restoreRecover";
const restoreChoiceState = "deviceSetup.restoreChoice";
const droppedState = "awaitingSession";
const statesThatKeepTheStage = new Set([deviceLockedState, "readingState", droppedState]);
/** The device reboots after the held-back OS update: the OS check stays the shown step. */
const statesAfterHeldBackUpdate = new Set(["awaitingSessionAfterFirmwareUpdate", "routing"]);
const statesThatAnswerTheUpdate = new Set([
  "checks.firmwareUpdateDelegated",
  "checks.checksDone",
  "checks.leavingEarlyCheckScreen",
  checksSucceededState,
]);

function rechecksTheUpdate(rawLiveMachineState: string | null) {
  const liveMachineState = asChecksState(rawLiveMachineState);
  if (liveMachineState === null || statesThatAnswerTheUpdate.has(liveMachineState)) return false;
  return (
    liveMachineState.startsWith("checks.") ||
    liveMachineState === "routing" ||
    statesThatKeepTheStage.has(liveMachineState)
  );
}

const doneState = "done";
const setupExitState = "setupExit";

/** The seeded Nano checks the OS update it held back: the setup screen shows it as the last step. */
function isOsCheckAfterSetup(
  machineState: string | null,
  seeded: boolean,
  updateAfterSetup: boolean,
) {
  if (!updateAfterSetup || !seeded || machineState === null) return false;
  return (
    asChecksState(machineState)?.startsWith("checks.") === true || machineState === setupExitState
  );
}

export type RestoreDismissal = Readonly<{
  dismissed: boolean;
  dismiss: () => void;
  /** The state the screen shows: the restore choice once the Recover restore screen is closed. */
  visibleState: string | null;
}>;

/**
 * Closing the Recover restore screen, or a deviceOnboarding flag that hides Recover, shows the
 * restore choice while the machine stays on Recover.
 */
export function useRestoreDismissal(
  machineState: string | null,
  recoverRestoreAvailable = true,
): RestoreDismissal {
  const [dismissed, setDismissed] = useState(false);
  const dismiss = useCallback(() => setDismissed(true), []);
  if (dismissed && machineState !== restoreRecoverState) setDismissed(false);
  const showsChoice =
    (dismissed || !recoverRestoreAvailable) && machineState === restoreRecoverState;
  return { dismissed, dismiss, visibleState: showsChoice ? restoreChoiceState : machineState };
}

export type UnseededFunnelInput = {
  machineState: string | null;
  liveMachineState: string | null;
  restoreDismissal: RestoreDismissal;
  onboardedOnEntry: boolean | null;
  /** The Nano holds its OS update until it is seeded, so it shows the OS check as its last step. */
  updateAfterSetup?: boolean;
  /** The device is seeded: a check now is the OS check held back until setup. */
  seeded?: boolean;
  /** The funnel already reconnects a switched-off device: Setup must not start a second attempt. */
  funnelRecoversDrop?: boolean;
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
  /** Set for a tracked unseeded funnel: the setup screen sends its sheet events with these. */
  funnelProps?: FunnelProps | null;
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
  const { dismiss: dismissRestore, visibleState } = input.restoreDismissal;

  const unseeded = input.onboardedOnEntry === false && device !== null && machineState !== null;
  const updateAfterSetup = useLatched(unseeded && input.updateAfterSetup === true);
  const osCheck = isOsCheckAfterSetup(machineState, input.seeded === true, updateAfterSetup);
  const stage = unseeded
    ? toUnseededStage(device, visibleState, {
        currentStep: input.currentStep,
        reportsRecoveryKey: input.reportsRecoveryKey,
        updateAfterSetup,
        osCheck,
      })
    : null;
  const holdsPrevious =
    unseeded &&
    (waitsForUpdatedDevice(machineState, input.seeded === true, updateAfterSetup) ||
      holdsPreviousStage(machineState, input.currentStep));

  const visibleStage = useHeldStage(stage, holdsPrevious);
  const connection = useSessionReconnect({
    dropped: unseeded && visibleStage !== null && setupRecoversDrop(liveMachineState, input),
    error: input.connectionError,
    connect: input.reconnect,
  });
  useContinueChecks(unseeded, liveMachineState, send);
  const confirmSkipUpdate = useConfirmSkipAfterUpdateScreen({
    returnsWithoutUpdate: input.returnsWithoutUpdate,
    recheckingUpdate: unseeded && rechecksTheUpdate(liveMachineState),
  });

  if (unseeded && machineState === doneState) return toDoneModel(input);
  if (unseeded && visibleState === restoreRecoverState) {
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
      checks: toChecks(input, machineState, confirmSkipUpdate, osCheck),
      funnelProps: input.funnelProps ?? null,
      onQuit: input.onQuit,
    },
  };
}

function toUnseededStage(
  device: Device | null,
  machineState: string | null,
  options: Readonly<{
    currentStep: string | null;
    reportsRecoveryKey: boolean;
    updateAfterSetup: boolean;
    osCheck: boolean;
  }>,
): SetupScreenStage | null {
  if (!device || !machineState) return null;
  const stage = toSetupStage({
    machineState,
    modelId: device.modelId,
    currentStep: options.currentStep,
    updateAfterSetup: options.updateAfterSetup,
    osCheck: options.osCheck,
  });
  if (!stage) return null;
  const infoCard = toSetupInfoCard(machineState, options.reportsRecoveryKey);
  return infoCard ? { ...stage, infoCard } : stage;
}

/** Stays true once set: the OS version changes after the update, the step layout must not. */
function useLatched(value: boolean): boolean {
  const [latched, setLatched] = useState(value);
  if (value && !latched) setLatched(true);
  return latched || value;
}

/** Setup reconnects a dropped session itself, unless the funnel already recovers the device. */
function setupRecoversDrop(
  liveMachineState: string | null,
  input: Pick<UnseededFunnelInput, "funnelRecoversDrop">,
): boolean {
  return liveMachineState === droppedState && input.funnelRecoversDrop !== true;
}

function waitsForUpdatedDevice(
  machineState: string | null,
  seeded: boolean,
  updateAfterSetup: boolean,
): boolean {
  if (!updateAfterSetup || !seeded || machineState === null) return false;
  return statesAfterHeldBackUpdate.has(machineState);
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
function useHeldStage(
  stage: SetupScreenStage | null,
  holdsPrevious: boolean,
): SetupScreenStage | null {
  const [heldStage, setHeldStage] = useState<SetupScreenStage | null>(null);

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
  rawMachineState: string,
  confirmSkipUpdate: boolean,
  osCheck: boolean,
): SetupChecksProps | null {
  const machineState = asChecksState(rawMachineState) ?? rawMachineState;
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
    ...(osCheck && isFirmwareCheckFailed(machineState)
      ? { onSkipFirmwareCheck: () => send({ type: "SKIP" }) }
      : {}),
  };
}

function sameStage(next: SetupScreenStage, held: SetupScreenStage | null) {
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
