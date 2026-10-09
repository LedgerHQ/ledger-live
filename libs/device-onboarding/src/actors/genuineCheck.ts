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
import type { OnboardingEvent } from "../types";

export type GenuineCheckEvent = Extract<
  OnboardingEvent,
  {
    type:
      | "ALLOW_SECURE_CONNECTION_REQUESTED"
      | "SECURE_CONNECTION_ALLOWED"
      | "GENUINE_CHECK_PASSED"
      | "GENUINE_CHECK_REFUSED"
      | "GENUINE_CHECK_FAILED"
      | "DEVICE_NOT_GENUINE"
      | "SECURE_CHANNEL_LOST";
  }
>;

export type GenuineCheckFailureEvent = Extract<
  GenuineCheckEvent,
  { type: "GENUINE_CHECK_REFUSED" | "GENUINE_CHECK_FAILED" | "SECURE_CHANNEL_LOST" }
>;

export type GenuineCheckInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  retryPolicy?: RetryPolicy;
};

export function mapGenuineCheckFailure(error: unknown): GenuineCheckFailureEvent {
  if (isDeviceRefusal(error)) {
    return { type: "GENUINE_CHECK_REFUSED", output: error };
  }

  if (isSecureChannelLost(error)) {
    return { type: "SECURE_CHANNEL_LOST", output: error };
  }

  return { type: "GENUINE_CHECK_FAILED", output: error };
}

export const genuineCheck = fromCallback<GenuineCheckEvent, GenuineCheckInput>(
  ({ input, sendBack }) => {
    let stopped = false;
    let secureConnectionOpen = false;

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
        if (stopped) return;

        const awaitsSecureConnectionApproval =
          requiredUserInteraction === UserInteractionRequired.AllowSecureConnection;

        if (awaitsSecureConnectionApproval) {
          if (!secureConnectionOpen) {
            sendBack({ type: "ALLOW_SECURE_CONNECTION_REQUESTED" });
          }
        } else if (secureConnectionOpen) {
          sendBack({ type: "SECURE_CONNECTION_ALLOWED" });
        }

        secureConnectionOpen = awaitsSecureConnectionApproval;
      },
    );

    const policy = input.retryPolicy ?? createRetryPolicy(isCatalogueUnreachable);

    withRetries(runner.run, policy, { isCancelled: () => stopped })
      .then(output => {
        if (!stopped) {
          sendBack(
            output.isGenuine
              ? { type: "GENUINE_CHECK_PASSED", output }
              : { type: "DEVICE_NOT_GENUINE", output },
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
