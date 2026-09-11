import {
  GenuineCheckDeviceAction,
  UserInteractionRequired,
  type DeviceManagementKit,
  type DeviceSessionId,
  type GenuineCheckDAError,
  type GenuineCheckDAIntermediateValue,
  type GenuineCheckDAOutput,
} from "@ledgerhq/device-management-kit";
import { fromCallback } from "xstate";
import { createDeviceActionRunner } from "../device/deviceAction";
import { isCatalogueUnreachable, isDeviceRefusal, isSecureChannelLost } from "../device/errors";
import { createRetryPolicy, withRetries, type RetryPolicy } from "../retry";
import type { GenuineCheckFailure, OnboardingEvent } from "../types";

export type GenuineCheckEvent = Extract<
  OnboardingEvent,
  {
    type:
      | "ALLOW_SECURE_CONNECTION_REQUESTED"
      | "GENUINE_CHECK_PASSED"
      | "GENUINE_CHECK_REFUSED"
      | "GENUINE_CHECK_FAILED"
      | "DEVICE_NOT_GENUINE"
      | "SECURE_CHANNEL_LOST";
  }
>;

export type GenuineCheckFailureEvent = Extract<GenuineCheckEvent, { failure: GenuineCheckFailure }>;

export type GenuineCheckInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  retryPolicy?: RetryPolicy;
};

export function mapGenuineCheckFailure(error: unknown): GenuineCheckFailureEvent {
  if (isDeviceRefusal(error)) {
    return { type: "GENUINE_CHECK_REFUSED", failure: error };
  }

  if (isSecureChannelLost(error)) {
    return { type: "SECURE_CHANNEL_LOST", failure: error };
  }

  return { type: "GENUINE_CHECK_FAILED", failure: error };
}

export const genuineCheck = fromCallback<GenuineCheckEvent, GenuineCheckInput>(
  ({ input, sendBack }) => {
    let stopped = false;

    const runner = createDeviceActionRunner<
      GenuineCheckDAOutput,
      GenuineCheckDAError,
      GenuineCheckDAIntermediateValue
    >(
      () =>
        input.dmk.executeDeviceAction({
          sessionId: input.sessionId,
          // The devices being onboarded are exactly the ones the default input rejects.
          deviceAction: new GenuineCheckDeviceAction({
            input: { allowNonOnboardedDevice: true },
          }),
        }),
      ({ requiredUserInteraction }) => {
        const awaitsSecureConnectionApproval =
          requiredUserInteraction === UserInteractionRequired.AllowSecureConnection;

        if (!stopped && awaitsSecureConnectionApproval) {
          sendBack({ type: "ALLOW_SECURE_CONNECTION_REQUESTED" });
        }
      },
    );

    const policy = input.retryPolicy ?? createRetryPolicy(isCatalogueUnreachable);

    withRetries(runner.run, policy, { isCancelled: () => stopped })
      .then(output => {
        if (!stopped) {
          sendBack(
            output.isGenuine
              ? { type: "GENUINE_CHECK_PASSED" }
              : { type: "DEVICE_NOT_GENUINE", failure: output },
          );
        }
      })
      .catch(error => {
        if (!stopped) {
          sendBack(mapGenuineCheckFailure(error));
        }
      });

    return () => {
      stopped = true;
      runner.stop();
    };
  },
);
