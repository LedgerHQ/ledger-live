import { assign } from "xstate";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
  DeviceOnboardingInput,
  DeviceOnboardingOutput,
  GenuineVerdict,
  OnboardingEvent,
} from "./types";

export type ExitOutput = { reason: DeviceOnboardingExitReason };

export function initialContext(input: DeviceOnboardingInput): DeviceOnboardingContext {
  return {
    ...input,
    lastDeviceState: null,
    firmwareVersion: null,
    isOnboarded: false,
    genuineVerdict: null,
    secureConnectionRequested: false,
    lastGenuineFailure: null,
    onEarlyCheckScreen: false,
    firmwareChecked: false,
    checksPaused: false,
    availableFirmwareUpdate: null,
    currentSetupStep: null,
  };
}

export function currentVerdict(context: DeviceOnboardingContext): GenuineVerdict | null {
  const { genuineVerdict } = context;

  if (genuineVerdict === null || genuineVerdict.sessionId !== context.ports.currentSessionId()) {
    return null;
  }

  return genuineVerdict;
}

export function exitContract(
  context: DeviceOnboardingContext,
  output: unknown,
): DeviceOnboardingOutput {
  return {
    sessionId: context.ports.currentSessionId(),
    device: { id: context.deviceId, modelId: context.deviceModelId },
    reason: (output as ExitOutput).reason,
  };
}

const update = assign<DeviceOnboardingContext, OnboardingEvent, undefined, OnboardingEvent, never>;

export const contextActions = {
  rememberDeviceState: update(({ event }) => {
    if (event.type !== "DEVICE_STATE_READ") {
      return {};
    }

    return {
      lastDeviceState: event.state,
      isOnboarded: event.state.isOnboarded,
      firmwareVersion: event.firmwareVersion,
    };
  }),
  rememberUnreadableDeviceState: update(({ event }) => {
    if (event.type !== "DEVICE_STATE_UNREADABLE") {
      return {};
    }

    return {
      lastDeviceState: null,
      isOnboarded: event.isOnboarded,
      firmwareVersion: event.firmwareVersion,
    };
  }),
  enterEarlyCheckScreen: update({ onEarlyCheckScreen: true }),
  leaveEarlyCheckScreen: update({ onEarlyCheckScreen: false }),
  rememberSecureConnectionRequested: update({ secureConnectionRequested: true }),
  forgetSecureConnectionRequested: update({ secureConnectionRequested: false }),
  rememberGenuineChecked: update(({ context }) => ({
    genuineVerdict: { sessionId: context.ports.currentSessionId(), isGenuine: true },
    lastGenuineFailure: null,
  })),
  rememberGenuineFailure: update(({ context, event }) => {
    if (!("failure" in event)) {
      return {};
    }

    const verdict =
      event.type === "DEVICE_NOT_GENUINE"
        ? { sessionId: context.ports.currentSessionId(), isGenuine: false }
        : context.genuineVerdict;

    return {
      genuineVerdict: verdict,
      lastGenuineFailure: { kind: event.type, failure: event.failure },
    };
  }),
  forgetGenuineFailure: update({ lastGenuineFailure: null }),
  rememberFirmwareChecked: update({ firmwareChecked: true, availableFirmwareUpdate: null }),
  rememberAvailableUpdate: update(({ event }) => {
    if (event.type !== "FIRMWARE_UPDATE_AVAILABLE") {
      return {};
    }

    return { availableFirmwareUpdate: event.update };
  }),
  forgetFirmwareCheck: update({ firmwareChecked: false, availableFirmwareUpdate: null }),
  carryAttestationThroughReboot: update(({ context }) => {
    const { genuineVerdict } = context;

    if (genuineVerdict === null) {
      return {};
    }

    return { genuineVerdict: { ...genuineVerdict, sessionId: context.ports.currentSessionId() } };
  }),
  pauseChecks: update({ checksPaused: true }),
  resumeChecks: update({ checksPaused: false }),
};
