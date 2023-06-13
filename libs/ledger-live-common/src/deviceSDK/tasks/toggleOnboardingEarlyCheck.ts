import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { DeviceId } from "@ledgerhq/types-live";
import { SharedTaskEvent } from "./core";
import { withTransport } from "../transports/core";
import {
  toggleOnboardingEarlyCheckCmd,
  ToggleTypeP2,
} from "../commands/toggleOnboardingEarlyCheck";
import { StatusCodes, TransportStatusError } from "@ledgerhq/errors";

export type ToggleOnboardingEarlyCheckTaskError =
  | "DeviceInInvalidState"
  | "InternalError"
  | "Unknown";

export type ToggleOnboardingEarlyCheckTaskErrorEvent = {
  type: "taskError";
  error: ToggleOnboardingEarlyCheckTaskError;
};

export type ToggleOnboardingEarlyCheckTaskEvent =
  | { type: "success" }
  | ToggleOnboardingEarlyCheckTaskErrorEvent
  | SharedTaskEvent;

export type ToggleOnboardingEarlyCheckTaskArgs = {
  deviceId: DeviceId;
  toggleType: "enter" | "exit";
};

/**
 * During the onboarding, makes the device enter or exit the early security check steps
 *
 * This task only puts (or moves out) the device to the state/step of the early security check.
 * It does not starts any "security checks".
 *
 * If the device is not in the WELCOME or WELCOME_STEP2 onboarding state, this task will emit
 * a "DeviceInInvalidState" event.
 *
 * @param deviceId The id of the targeted device
 * @param toggleType either "enter" or "exit"
 * @returns An observable that emits a success, error or shared-task event
 */
export function toggleOnboardingEarlyCheckTask({
  deviceId,
  toggleType,
}: ToggleOnboardingEarlyCheckTaskArgs): Observable<ToggleOnboardingEarlyCheckTaskEvent> {
  const p2 =
    toggleType === "enter"
      ? ToggleTypeP2.EnterChecking
      : ToggleTypeP2.ExitChecking;

  return new Observable((subscriber) => {
    withTransport(deviceId)(({ transportRef }) =>
      toggleOnboardingEarlyCheckCmd({
        transport: transportRef.current,
        p2,
      })
    ).subscribe({
      next: (_) => subscriber.next({ type: "success" }),
      error: (error: unknown) => {
        if (error instanceof TransportStatusError) {
          // @ts-expect-error TransportStatusError not typed correctly
          if (error.statusCode === StatusCodes.SECURITY_STATUS_NOT_SATISFIED) {
            subscriber.next({
              type: "taskError",
              error: "DeviceInInvalidState",
            });
            return;
          }
          // @ts-expect-error TransportStatusError not typed correctly
          else if (error.statusCode === StatusCodes.INCORRECT_LENGTH) {
            subscriber.next({
              type: "taskError",
              error: "InternalError",
            });
            return;
          }
        }
        // Otherwise unknown error
        let message = "";
        if (error instanceof Error) {
          message = `${error.name}: ${error.message}`;
        }
        log("toggleOnboardingEarlyCheckTask", `Error: ${message}`);
        subscriber.next({ type: "taskError", error: "Unknown" });
      },
      complete: () => subscriber.complete(),
    });
  });
}
