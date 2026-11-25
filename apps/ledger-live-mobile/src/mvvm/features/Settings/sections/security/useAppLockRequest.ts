import { useCallback } from "react";
import type { AppLockAction } from "@features/flow-settings-security";

/**
 * Turns the section's App lock request into a password switch change. Mobile has no Change
 * password row: a password is replaced by removing it and setting a new one.
 */
export function useAppLockRequest(onPasswordChange: (enabled: boolean) => void) {
  return useCallback(
    (action: AppLockAction) => {
      if (action !== "change") onPasswordChange(action === "set");
    },
    [onPasswordChange],
  );
}
