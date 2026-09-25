import type { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";
import { fromCallback } from "xstate";
import { sendOsVersionCommand } from "../device/onboardingState";
import type { OnboardingEvent } from "../types";

export type UnlockPollingEvent = Extract<OnboardingEvent, { type: "UNLOCKED" }>;

export type UnlockPollingInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  intervalMs?: number;
};

export const defaultUnlockPollingIntervalMs = 1000;

/**
 * Hosts connect with the session refresher disabled, so the kit revises its device status only
 * when a command runs. Every other actor is stopped while the machine waits on a locked device,
 * so without this loop nothing would ever notice the unlock.
 */
export const unlockPolling = fromCallback<UnlockPollingEvent, UnlockPollingInput>(
  ({ input, sendBack }) => {
    const intervalMs = input.intervalMs ?? defaultUnlockPollingIntervalMs;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const waitForNextPoll = () =>
      new Promise<void>(resolve => {
        timer = setTimeout(resolve, intervalMs);
      });

    const poll = async () => {
      while (!stopped) {
        try {
          await sendOsVersionCommand(input.dmk, input.sessionId);

          if (!stopped) {
            sendBack({ type: "UNLOCKED" });
          }

          return;
        } catch {
          // A locked device rejects the command, which is the signal to keep waiting.
        }

        await waitForNextPoll();
      }
    };

    void poll();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  },
);
