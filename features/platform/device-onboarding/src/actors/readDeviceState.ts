import {
  CloseAppCommand,
  GetAppAndVersionCommand,
  isDashboardName,
  isSuccessCommandResult,
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
 * The OS version command works only on the dashboard, so an open app is closed first. Only an open
 * app: on the dashboard, close app would still make DMK wait for a disconnection, and a failed wait
 * ends the session. When the app is unknown, the read goes on.
 *
 * An actor stopped between two commands must not reach the device again: the next flow may
 * already use it.
 */
async function readOnDashboard(
  dmk: DeviceManagementKit,
  sessionId: DeviceSessionId,
  isCancelled: () => boolean,
): Promise<GetOsVersionResponse> {
  const app = await dmk.sendCommand({ sessionId, command: new GetAppAndVersionCommand() });
  stopIfCancelled(isCancelled);

  if (isSuccessCommandResult(app) && !isDashboardName(app.data.name)) {
    await dmk.sendCommand({ sessionId, command: new CloseAppCommand() });
    stopIfCancelled(isCancelled);
  }

  return sendOsVersionCommand(dmk, sessionId);
}

function stopIfCancelled(isCancelled: () => boolean): void {
  if (isCancelled()) {
    throw new Error("The read stopped before reaching the device again");
  }
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
