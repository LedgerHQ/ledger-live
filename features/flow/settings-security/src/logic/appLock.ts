import type { AppLockAction } from "../types";

/**
 * The password flow behind a press on App lock. The toggle sets the password or removes it, the
 * change button changes it, and there is nothing to change without a password.
 */
export function getAppLockAction(
  passwordSet: boolean,
  intent: "toggle" | "change",
): AppLockAction | null {
  if (intent === "change") return passwordSet ? "change" : null;
  return passwordSet ? "remove" : "set";
}
