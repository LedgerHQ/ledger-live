import {
  CloseAppCommand,
  type DeviceManagementKit,
  type DeviceSessionId,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import { fromCallback } from "xstate";
import { readOnboardingState, sendOsVersionCommand } from "../device/onboardingState";
import { createRetryPolicy, withRetries, type RetryPolicy } from "../retry";
import type { OnboardingEvent } from "../types";

export type ReadDeviceStateEvent = Extract<
  OnboardingEvent,
  {
    type:
      | "DEVICE_STATE_READ"
      | "DEVICE_STATE_UNREADABLE"
      | "DEVICE_STATE_FAILED"
      | "DEVICE_IN_BOOTLOADER"
      | "DEVICE_IN_OSU";
  }
>;

export type ReadDeviceStateInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  retryPolicy?: RetryPolicy;
};

export function mapDeviceState(response: GetOsVersionResponse): ReadDeviceStateEvent {
  if (response.isBootloader) {
    return { type: "DEVICE_IN_BOOTLOADER", output: response.seVersion };
  }

  if (response.isOsu) {
    return { type: "DEVICE_IN_OSU", output: response.seVersion };
  }

  const state = readOnboardingState(response);
  const firmwareVersion = response.seVersion;

  if (state === null) {
    const flags = response.secureElementFlags;

    return {
      type: "DEVICE_STATE_UNREADABLE",
      isOnboarded: flags.isOnboarded,
      isInRecoveryMode: flags.isInRecoveryMode,
      firmwareVersion,
    };
  }

  return { type: "DEVICE_STATE_READ", state, firmwareVersion };
}

/**
 * The OS version command works only on the dashboard, so any open app is closed first. An actor
 * stopped while the app closes must not reach the device again: the next flow may already use it.
 */
async function readOnDashboard(
  dmk: DeviceManagementKit,
  sessionId: DeviceSessionId,
  isCancelled: () => boolean,
): Promise<GetOsVersionResponse> {
  await dmk.sendCommand({ sessionId, command: new CloseAppCommand() });

  if (isCancelled()) {
    throw new Error("The read stopped while the app was closing");
  }

  return sendOsVersionCommand(dmk, sessionId);
}

export const readDeviceState = fromCallback<ReadDeviceStateEvent, ReadDeviceStateInput>(
  ({ input, sendBack }) => {
    let stopped = false;

    const policy = input.retryPolicy ?? createRetryPolicy(() => true);

    const isCancelled = () => stopped;

    withRetries(() => readOnDashboard(input.dmk, input.sessionId, isCancelled), policy, {
      isCancelled,
    })
      .then(response => {
        if (!stopped) {
          sendBack(mapDeviceState(response));
        }
      })
      .catch((error: unknown) => {
        if (!stopped) {
          sendBack({ type: "DEVICE_STATE_FAILED", output: error });
        }
      });

    return () => {
      stopped = true;
    };
  },
);
