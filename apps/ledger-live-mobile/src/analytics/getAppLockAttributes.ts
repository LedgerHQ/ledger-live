import { resolveAppLockScheme, selectAppLock, type WithAppLock } from "@features/platform-app-lock";
import type { Privacy } from "~/reducers/types";

type AppLockAttributesState = WithAppLock &
  Readonly<{
    settings: Readonly<{ privacy: Privacy | null | undefined }>;
  }>;

export type AppLockAttributes = Readonly<{
  password_enabled: boolean;
  biometrics_enabled: boolean;
}>;

export function getAppLockAttributes(
  state: AppLockAttributesState,
  isRevampEnabled: boolean,
): AppLockAttributes {
  const appLock = selectAppLock(state);
  const scheme = resolveAppLockScheme({
    hasStoredProtection: appLock.hasPassword || appLock.biometricsEnabled,
    isRevampEnabled,
  });
  const protection = scheme === "revamped" ? appLock : state.settings.privacy;

  return {
    password_enabled: protection?.hasPassword ?? false,
    biometrics_enabled: protection?.biometricsEnabled ?? false,
  };
}
