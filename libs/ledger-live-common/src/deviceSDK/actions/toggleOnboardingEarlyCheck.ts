import { DeviceId } from "@ledgerhq/types-live";
import { FullActionState, initialSharedActionState, sharedReducer } from "./core";
import {
  ToggleOnboardingEarlyCheckTaskError,
  ToggleOnboardingEarlyCheckTaskEvent,
  toggleOnboardingEarlyCheckTask,
} from "../tasks/toggleOnboardingEarlyCheck";
import { Observable } from "rxjs";
import { scan } from "rxjs/operators";

export type ToggleOnboardingEarlyCheckActionArgs = {
  deviceId: DeviceId;
  toggleType: "enter" | "exit";
};

// Union of all the tasks specific errors
export type ToggleOnboardingEarlyCheckActionErrorName = ToggleOnboardingEarlyCheckTaskError;

export type ToggleOnboardingEarlyCheckActionState = FullActionState<{
  toggleStatus: "none" | "success" | "failure";
  error: {
    type: "ToggleOnboardingEarlyCheckError";
    name: ToggleOnboardingEarlyCheckActionErrorName;
  } | null;
}>;

export const initialState: ToggleOnboardingEarlyCheckActionState = {
  toggleStatus: "none",
  ...initialSharedActionState,
};

/**
 * During the onboarding, makes the device enter or exit the early security check steps
 *
 * This action only puts (or moves out) the device to the state/step of the early security check.
 * It does not starts any "security checks".
 *
 * If the device is not in the WELCOME or WELCOME_STEP2 onboarding state, this action will emit
 * a "DeviceInInvalidState" event.
 *
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @param toggleType either "enter" or "exit"
 * @returns An observable that emits updates on the of the onboarding early check toggling state
 */
export function toggleOnboardingEarlyCheckAction({
  deviceId,
  toggleType,
}: ToggleOnboardingEarlyCheckActionArgs): Observable<ToggleOnboardingEarlyCheckActionState> {
  return toggleOnboardingEarlyCheckTask({ deviceId, toggleType }).pipe(
    scan<ToggleOnboardingEarlyCheckTaskEvent, ToggleOnboardingEarlyCheckActionState>(
      (currentState, event) => {
        switch (event.type) {
          case "taskError":
            return {
              ...initialState,
              error: {
                type: "ToggleOnboardingEarlyCheckError",
                name: event.error,
              },
              toggleStatus: "failure",
            };
          case "success":
            return {
              ...currentState,
              error: null,
              toggleStatus: "success",
            };
          case "error":
            return {
              ...currentState,
              ...sharedReducer({
                event,
              }),
              toggleStatus: "failure",
            };
        }
      },
      initialState,
    ),
  );
}
