import { fromCallback } from "xstate";
import { isCatalogueUnreachable } from "../device/errors";
import { createRetryPolicy, withRetries, type RetryPolicy } from "../retry";
import type { AvailableFirmwareUpdate, OnboardingEvent } from "../types";

export type FirmwareCheckEvent = Extract<
  OnboardingEvent,
  { type: "FIRMWARE_UP_TO_DATE" | "FIRMWARE_UPDATE_AVAILABLE" | "FIRMWARE_CHECK_FAILED" }
>;

export type FirmwareCheckInput = {
  lookupFirmwareUpdate: () => Promise<AvailableFirmwareUpdate | null>;
  retryPolicy?: RetryPolicy;
};

export function mapFirmwareLookup(update: AvailableFirmwareUpdate | null): FirmwareCheckEvent {
  return update === null
    ? { type: "FIRMWARE_UP_TO_DATE" }
    : { type: "FIRMWARE_UPDATE_AVAILABLE", update };
}

export const firmwareCheck = fromCallback<FirmwareCheckEvent, FirmwareCheckInput>(
  ({ input, sendBack }) => {
    let stopped = false;
    const policy = input.retryPolicy ?? createRetryPolicy(isCatalogueUnreachable);

    withRetries(input.lookupFirmwareUpdate, policy, { isCancelled: () => stopped })
      .then(update => {
        if (!stopped) {
          sendBack(mapFirmwareLookup(update));
        }
      })
      .catch(() => {
        if (!stopped) {
          sendBack({ type: "FIRMWARE_CHECK_FAILED" });
        }
      });

    return () => {
      stopped = true;
    };
  },
);
