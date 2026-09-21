import {
  isSuccessCommandResult,
  type DeviceManagementKit,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import { fromCallback } from "xstate";
import { ToggleEarlyCheckCommand, type EarlyCheckToggle } from "../device/toggleEarlyCheckCommand";
import type { OnboardingEvent } from "../types";

export type ToggleEarlyCheckEvent = Extract<
  OnboardingEvent,
  { type: "EARLY_CHECK_TOGGLED" | "EARLY_CHECK_UNAVAILABLE" }
>;

export type ToggleEarlyCheckInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  toggle: EarlyCheckToggle;
};

export const toggleEarlyCheck = fromCallback<ToggleEarlyCheckEvent, ToggleEarlyCheckInput>(
  ({ input, sendBack }) => {
    let stopped = false;

    input.dmk
      .sendCommand({
        sessionId: input.sessionId,
        command: new ToggleEarlyCheckCommand(input.toggle),
      })
      .then(result => {
        if (!stopped) {
          sendBack(
            isSuccessCommandResult(result)
              ? { type: "EARLY_CHECK_TOGGLED" }
              : { type: "EARLY_CHECK_UNAVAILABLE" },
          );
        }
      })
      .catch(() => {
        if (!stopped) {
          sendBack({ type: "EARLY_CHECK_UNAVAILABLE" });
        }
      });

    return () => {
      stopped = true;
    };
  },
);
