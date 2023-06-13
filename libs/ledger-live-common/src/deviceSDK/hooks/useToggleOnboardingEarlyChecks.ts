import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import {
  ToggleOnboardingEarlyCheckActionArgs,
  ToggleOnboardingEarlyCheckActionState,
  toggleOnboardingEarlyCheckAction as defaultToggleOnboardingEarlyCheckAction,
  initialState,
} from "../actions/toggleOnboardingEarlyCheck";

export type UseToggleOnboardingEarlyCheckArgs = {
  toggleOnboardingEarlyCheckAction?: typeof defaultToggleOnboardingEarlyCheckAction;
  deviceId: string;
  toggleType: ToggleOnboardingEarlyCheckActionArgs["toggleType"] | null;
};

/**
 * Hook making the device enter or exit the early security check steps, during the onboarding
 *
 * This hook only puts (or moves out) the device to the state/step of the early security check.
 * It does not starts any "security checks".
 *
 * If the device is not in the WELCOME or WELCOME_STEP2 onboarding state, this hook will update
 * its `toggleStatus` to `failure`.
 *
 * You can reset the result state by updating `toggleType` to null
 *
 * @param deviceId The id of the targeted device that can be
 * @param toggleType either null, "enter" or "exit".
 *  If null, the hook does not subscribe to the underlying device action, and nothing happens.
 *  Useful to enable/disable this hook.
 * @param toggleOnboardingEarlyCheckAction dependency injected action. A default implementation is provided.
 * @returns an object containing the state of the onboarding early check toggling with possible error.
 *   The resulting state is reset to its initial state on each new triggering of the toggle action (when `toggleType` is updated):
 * {
 *   toggleStatus: "none",
 *   ...initialSharedActionState,
 * }
 */
export const useToggleOnboardingEarlyCheck = ({
  toggleOnboardingEarlyCheckAction = defaultToggleOnboardingEarlyCheckAction,
  deviceId,
  toggleType,
}: UseToggleOnboardingEarlyCheckArgs): {
  state: ToggleOnboardingEarlyCheckActionState;
} => {
  const [state, setState] = useState<ToggleOnboardingEarlyCheckActionState>(initialState);

  useEffect(() => {
    if (toggleType === null) return;

    const subscription = toggleOnboardingEarlyCheckAction({
      deviceId,
      toggleType,
    }).subscribe({
      next: setState,
      error: (error: unknown) => {
        log("useToggleOnboardingEarlyCheck", "Unknown error", error);
      },
    });

    return () => {
      // Resets the resulting state on each new triggering
      setState(initialState);

      subscription.unsubscribe();
    };
  }, [deviceId, toggleOnboardingEarlyCheckAction, toggleType]);

  return { state };
};
