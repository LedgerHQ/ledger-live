import type {
  DeviceManagementKit,
  DeviceSessionId,
  GetOsVersionResponse,
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
    return { type: "DEVICE_IN_BOOTLOADER" };
  }

  if (response.isOsu) {
    return { type: "DEVICE_IN_OSU" };
  }

  const state = readOnboardingState(response);

  if (state === null) {
    const flags = response.secureElementFlags;

    return {
      type: "DEVICE_STATE_UNREADABLE",
      isOnboarded: flags.isOnboarded,
      isInRecoveryMode: flags.isInRecoveryMode,
    };
  }

  return { type: "DEVICE_STATE_READ", state };
}

export const readDeviceState = fromCallback<ReadDeviceStateEvent, ReadDeviceStateInput>(
  ({ input, sendBack }) => {
    let stopped = false;

    const policy = input.retryPolicy ?? createRetryPolicy(() => true);

    withRetries(() => sendOsVersionCommand(input.dmk, input.sessionId), policy, {
      isCancelled: () => stopped,
    })
      .then(response => {
        if (!stopped) {
          sendBack(mapDeviceState(response));
        }
      })
      .catch(() => {
        if (!stopped) {
          sendBack({ type: "DEVICE_STATE_FAILED" });
        }
      });

    return () => {
      stopped = true;
    };
  },
);
