import {
  GetDeviceMetadataDeviceAction,
  UserInteractionRequired,
  type DeviceManagementKit,
  type DeviceSessionId,
  type GetDeviceMetadataDAError,
  type GetDeviceMetadataDAIntermediateValue,
  type GetDeviceMetadataDAOutput,
} from "@ledgerhq/device-management-kit";
import { fromCallback } from "xstate";
import { createDeviceActionRunner } from "../device/deviceAction";
import { isCatalogueUnreachable } from "../device/errors";
import { createRetryPolicy, withRetries, type RetryPolicy } from "../retry";
import type { OnboardingEvent } from "../types";

export type FirmwareCheckEvent = Extract<
  OnboardingEvent,
  {
    type: "LOCKED" | "FIRMWARE_UP_TO_DATE" | "FIRMWARE_UPDATE_AVAILABLE" | "FIRMWARE_CHECK_FAILED";
  }
>;

export type FirmwareCheckInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  retryPolicy?: RetryPolicy;
};

export function mapFirmwareMetadata(metadata: GetDeviceMetadataDAOutput): FirmwareCheckEvent {
  const { availableUpdate } = metadata.firmwareUpdateContext;

  return availableUpdate === undefined
    ? { type: "FIRMWARE_UP_TO_DATE", output: metadata }
    : {
        type: "FIRMWARE_UPDATE_AVAILABLE",
        output: {
          ...metadata,
          firmwareUpdateContext: { ...metadata.firmwareUpdateContext, availableUpdate },
        },
      };
}

export const firmwareCheck = fromCallback<FirmwareCheckEvent, FirmwareCheckInput>(
  ({ input, sendBack }) => {
    let stopped = false;
    let reportedLock = false;

    const runner = createDeviceActionRunner<
      GetDeviceMetadataDAOutput,
      GetDeviceMetadataDAError,
      GetDeviceMetadataDAIntermediateValue
    >(
      () =>
        input.dmk.executeDeviceAction({
          sessionId: input.sessionId,
          deviceAction: new GetDeviceMetadataDeviceAction({
            input: { useSecureChannel: true, forceUpdate: false, allowNonOnboardedDevice: true },
          }),
        }),
      ({ requiredUserInteraction }) => {
        if (stopped || reportedLock) return;
        if (requiredUserInteraction !== UserInteractionRequired.UnlockDevice) return;

        reportedLock = true;
        sendBack({ type: "LOCKED" });
      },
    );

    const policy = input.retryPolicy ?? createRetryPolicy(isCatalogueUnreachable);

    withRetries(runner.run, policy, { isCancelled: () => stopped })
      .then(metadata => {
        if (!stopped) {
          sendBack(mapFirmwareMetadata(metadata));
        }
      })
      .catch((error: unknown) => {
        if (!stopped) {
          sendBack({ type: "FIRMWARE_CHECK_FAILED", output: error });
        }
      });

    return () => {
      stopped = true;
      runner.stop();
    };
  },
);
