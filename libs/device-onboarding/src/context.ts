import { assign } from "xstate";
import {
  isRecoveryKeyBackupInProgress,
  isSetupStep,
  RecoveryKeyStatus,
  type DeviceOnboardingContext,
  type DeviceOnboardingExitReason,
  type DeviceOnboardingInput,
  type DeviceOnboardingOutput,
  type GenuineVerdict,
  type OnboardingEvent,
} from "./types";

export type ExitOutput = { reason: DeviceOnboardingExitReason };

export function initialContext(input: DeviceOnboardingInput): DeviceOnboardingContext {
  return {
    ...input,
    lastDeviceState: null,
    firmwareVersion: null,
    hasStarted: false,
    isOnboarded: false,
    onboardedOnEntry: null,
    genuineVerdict: null,
    lastGenuineFailure: null,
    onEarlyCheckScreen: false,
    checksPaused: false,
    firmware: null,
    currentSetupStep: null,
    recoveryKeyBackupOpen: false,
  };
}

function recoveryKeyBackupStillOpen(open: boolean, status: RecoveryKeyStatus | null): boolean {
  if (status === null || status === RecoveryKeyStatus.Unknown) {
    return open;
  }

  return isRecoveryKeyBackupInProgress(status);
}

export function currentVerdict(context: DeviceOnboardingContext): GenuineVerdict | null {
  const { genuineVerdict } = context;

  if (genuineVerdict === null || genuineVerdict.sessionId !== context.sessionId) {
    return null;
  }

  return genuineVerdict;
}

export function exitContract(
  context: DeviceOnboardingContext,
  output: unknown,
): DeviceOnboardingOutput {
  return {
    sessionId: context.sessionId,
    device: { id: context.deviceId, modelId: context.deviceModelId },
    reason: (output as ExitOutput).reason,
  };
}

const update = assign<DeviceOnboardingContext, OnboardingEvent, undefined, OnboardingEvent, never>;

export const contextActions = {
  rememberDeviceState: update(({ context, event }) => {
    if (event.type !== "DEVICE_STATE_READ") {
      return {};
    }

    return {
      lastDeviceState: event.state,
      isOnboarded: event.state.isOnboarded,
      onboardedOnEntry: context.onboardedOnEntry ?? event.state.isOnboarded,
      firmwareVersion: event.firmwareVersion,
      recoveryKeyBackupOpen: recoveryKeyBackupStillOpen(
        context.recoveryKeyBackupOpen,
        event.state.recoveryKeyStatus,
      ),
    };
  }),
  rememberUnreadableDeviceState: update(({ context, event }) => {
    if (event.type !== "DEVICE_STATE_UNREADABLE") {
      return {};
    }

    return {
      lastDeviceState: null,
      isOnboarded: event.isOnboarded,
      onboardedOnEntry: context.onboardedOnEntry ?? event.isOnboarded,
      firmwareVersion: event.firmwareVersion,
    };
  }),
  rememberStart: update({ hasStarted: true }),
  enterEarlyCheckScreen: update({ onEarlyCheckScreen: true }),
  leaveEarlyCheckScreen: update({ onEarlyCheckScreen: false }),
  rememberGenuineChecked: update(({ context }) => ({
    genuineVerdict: { sessionId: context.sessionId, isGenuine: true },
    lastGenuineFailure: null,
  })),
  rememberGenuineFailure: update(({ context, event }) => {
    if (event.type === "DEVICE_NOT_GENUINE") {
      return {
        genuineVerdict: { sessionId: context.sessionId, isGenuine: false },
        lastGenuineFailure: { kind: event.type, failure: event.output },
      };
    }

    if (
      event.type !== "GENUINE_CHECK_REFUSED" &&
      event.type !== "GENUINE_CHECK_FAILED" &&
      event.type !== "SECURE_CHANNEL_LOST"
    ) {
      return {};
    }

    return {
      genuineVerdict: context.genuineVerdict,
      lastGenuineFailure: { kind: event.type, failure: event.output },
    };
  }),
  forgetGenuineFailure: update({ lastGenuineFailure: null }),
  rememberFirmwareChecked: update({ firmware: { kind: "checked" } }),
  rememberAvailableUpdate: update(({ event }) => {
    if (event.type !== "FIRMWARE_UPDATE_AVAILABLE") {
      return {};
    }

    return { firmware: { kind: "offered", update: event.output.update } };
  }),
  forgetFirmwareCheck: update({ firmware: null }),
  adoptSession: update(({ event }) => {
    if (event.type !== "SESSION_READY" && event.type !== "SESSION_CHANGED") {
      return {};
    }

    return { sessionId: event.sessionId };
  }),
  // The update reboots the device onto a new session, but this app ran it: the verdict still holds.
  carryAttestationThroughReboot: update(({ context, event }) => {
    if (event.type !== "FIRMWARE_UPDATE_FLOW_CLOSED") {
      return {};
    }

    const { genuineVerdict } = context;

    return {
      sessionId: event.sessionId,
      genuineVerdict: genuineVerdict && { ...genuineVerdict, sessionId: event.sessionId },
    };
  }),
  pauseChecks: update({ checksPaused: true }),
  resumeChecks: update({ checksPaused: false }),
  rememberSetupStep: update(({ context, event }) => {
    if (event.type !== "STEP_CHANGED") {
      return {};
    }

    return {
      lastDeviceState: event.state,
      currentSetupStep: isSetupStep(event.state.currentOnboardingStep)
        ? event.state.currentOnboardingStep
        : context.currentSetupStep,
      recoveryKeyBackupOpen: recoveryKeyBackupStillOpen(
        context.recoveryKeyBackupOpen,
        event.state.recoveryKeyStatus,
      ),
    };
  }),
  forgetSetupProgress: update({ currentSetupStep: null, recoveryKeyBackupOpen: false }),
};
