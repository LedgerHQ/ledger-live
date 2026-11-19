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
  { type: "STEP_CHANGED" | "TRANSPORT_LOST" | "POLLING_PAUSED" }
>;

export type SeedPollingCommand = { type: "PAUSE" } | { type: "RESUME" };

export type SeedPollingInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  intervalMs?: number;
  failureThreshold?: number;
};

export const defaultSeedPollingIntervalMs = 1000;
export const defaultSeedPollingFailureThreshold = 60;

/**
 * The loop is chained rather than scheduled on an interval so two APDUs can never overlap, and a
 * locked device or a disconnection is expected here: only a run of consecutive failures is worth
 * reporting as a lost transport.
 */
export const seedPolling = fromCallback<SeedPollingCommand, SeedPollingInput>(
  ({ input, sendBack, receive }) => {
    const intervalMs = input.intervalMs ?? defaultSeedPollingIntervalMs;
    const failureThreshold = input.failureThreshold ?? defaultSeedPollingFailureThreshold;

    let stopped = false;
    let paused = false;
    let polling = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let wakeWait: (() => void) | undefined;
    let lastState: DeviceOnboardingState | undefined;
    let consecutiveFailures = 0;

    const waitForNextPoll = () =>
      new Promise<void>(resolve => {
        const finish = () => {
          wakeWait = undefined;
          clearTimeout(timer);
          resolve();
        };
        wakeWait = finish;
        timer = setTimeout(finish, intervalMs);
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
      if (polling || stopped) return;
      polling = true;

      while (!stopped && !paused) {
        try {
          await reportStateChanges();
        } catch {
          consecutiveFailures++;

          if (consecutiveFailures >= failureThreshold) {
            if (!stopped) {
              sendBack({ type: "TRANSPORT_LOST" });
            }

            polling = false;
            return;
          }
        }

        if (stopped || paused) break;
        await waitForNextPoll();
      }

      polling = false;
      if (stopped || !paused) return;
      sendBack({ type: "POLLING_PAUSED" });
    };

    receive(event => {
      if (event.type === "PAUSE") {
        if (paused) return;
        paused = true;
        wakeWait?.();
        return;
      }

      if (stopped) return;
      const wasPaused = paused;
      paused = false;
      if (wasPaused && !polling) void poll();
    });

    void poll();

    return () => {
      stopped = true;
      wakeWait?.();
      clearTimeout(timer);
    };
  },
);
