import {
  GetDeviceMetadataDeviceAction,
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
  { type: "FIRMWARE_UP_TO_DATE" | "FIRMWARE_UPDATE_AVAILABLE" | "FIRMWARE_CHECK_FAILED" }
>;

export type FirmwareCheckInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  retryPolicy?: RetryPolicy;
};

export function mapFirmwareMetadata(metadata: GetDeviceMetadataDAOutput): FirmwareCheckEvent {
  const { availableUpdate } = metadata.firmwareUpdateContext;

  return availableUpdate === undefined
    ? { type: "FIRMWARE_UP_TO_DATE" }
    : { type: "FIRMWARE_UPDATE_AVAILABLE", update: availableUpdate };
}

export const firmwareCheck = fromCallback<FirmwareCheckEvent, FirmwareCheckInput>(
  ({ input, sendBack }) => {
    let stopped = false;

    const runner = createDeviceActionRunner<
      GetDeviceMetadataDAOutput,
      GetDeviceMetadataDAError,
      GetDeviceMetadataDAIntermediateValue
    >(() =>
      input.dmk.executeDeviceAction({
        sessionId: input.sessionId,
        deviceAction: new GetDeviceMetadataDeviceAction({
          input: { useSecureChannel: true, forceUpdate: false, allowNonOnboardedDevice: true },
        }),
      }),
    );

    const policy = input.retryPolicy ?? createRetryPolicy(isCatalogueUnreachable);

    withRetries(runner.run, policy, { isCancelled: () => stopped })
      .then(metadata => {
        if (!stopped) {
          sendBack(mapFirmwareMetadata(metadata));
        }
      })
      .catch(() => {
        if (!stopped) {
          sendBack({ type: "FIRMWARE_CHECK_FAILED" });
        }
      });

    return () => {
      stopped = true;
      runner.stop();
    };
  },
);
