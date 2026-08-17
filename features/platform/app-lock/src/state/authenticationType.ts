import type { AppLockState, AuthenticationType } from "./types";

type AppLockProtection = Pick<AppLockState, "hasPassword" | "biometricsEnabled">;

export function getAuthenticationType(protection: AppLockProtection): AuthenticationType {
  if (protection.hasPassword && protection.biometricsEnabled) {
    return "passwordAndBiometrics";
  }

  if (protection.hasPassword) {
    return "password";
  }

  if (protection.biometricsEnabled) {
    return "biometrics";
  }

  return "none";
}

export function isAppLockConfigured(protection: AppLockProtection): boolean {
  return getAuthenticationType(protection) !== "none";
}
