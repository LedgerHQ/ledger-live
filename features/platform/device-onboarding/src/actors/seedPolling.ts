import type { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";
import { fromCallback } from "xstate";
import {
  isSameOnboardingState,
  readOnboardingState,
  sendOsVersionCommand,
} from "../device/onboardingState";
import type { DeviceOnboardingState, OnboardingEvent } from "../types";

export type SeedPollingEvent = Extract<
  OnboardingEvent,
  { type: "STEP_CHANGED" | "TRANSPORT_LOST" }
>;

export type SeedPollingInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  intervalMs?: number;
  failureThreshold?: number;
};

export const defaultSeedPollingIntervalMs = 1000;
export const defaultSeedPollingFailureThreshold = 3;

/**
 * The loop is chained rather than scheduled on an interval so two APDUs can never overlap, and a
 * locked device or a disconnection is expected here: only a run of consecutive failures is worth
 * reporting as a lost transport.
 */
export const seedPolling = fromCallback<SeedPollingEvent, SeedPollingInput>(
  ({ input, sendBack }) => {
    const intervalMs = input.intervalMs ?? defaultSeedPollingIntervalMs;
    const failureThreshold = input.failureThreshold ?? defaultSeedPollingFailureThreshold;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastState: DeviceOnboardingState | undefined;
    let consecutiveFailures = 0;

    const waitForNextPoll = () =>
      new Promise<void>(resolve => {
        timer = setTimeout(resolve, intervalMs);
      });

    const reportStateChanges = async () => {
      const response = await sendOsVersionCommand(input.dmk, input.sessionId);
      const state = readOnboardingState(response);

      consecutiveFailures = 0;

      if (state !== null && !isSameOnboardingState(lastState, state)) {
        lastState = state;

        if (!stopped) {
          sendBack({ type: "STEP_CHANGED", state });
        }
      }
    };

    const poll = async () => {
      while (!stopped) {
        try {
          await reportStateChanges();
        } catch {
          consecutiveFailures++;

          if (consecutiveFailures >= failureThreshold) {
            if (!stopped) {
              sendBack({ type: "TRANSPORT_LOST" });
            }

            return;
          }
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
