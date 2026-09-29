import type { AppLockState } from "./types";

export type Protection = "password" | "biometrics";

type AppLockProtection = Pick<AppLockState, "hasPassword" | "biometricsEnabled">;

/**
 * Whether removing this one would leave the app with nothing protecting it. Says nothing about
 * whether that is allowed — who may go unprotected is the caller's business.
 */
export function isLastProtection(protection: AppLockProtection, removing: Protection): boolean {
  return removing === "password"
    ? protection.hasPassword && !protection.biometricsEnabled
    : protection.biometricsEnabled && !protection.hasPassword;
}
