import type { SecuritySettingsValues } from "../types";

export type SecurityPlatform = "desktop" | "mobile";

export type SecurityRowId =
  | "hideBalance"
  | "appLock"
  | "changePassword"
  | "autoLock"
  | "biometrics"
  | "mevProtection";

export type SecurityRow = Readonly<{ id: SecurityRowId; enabled: boolean }>;

/**
 * The rows of the Security section, in order. Change password and Auto-lock (desktop) and
 * biometrics (mobile) exist for the platform that has them and follow the App lock: the password
 * rows are hidden while no password is set, biometrics is disabled.
 */
export function getSecurityRows(
  values: Pick<SecuritySettingsValues, "passwordSet" | "biometricKind">,
  platform: SecurityPlatform,
): readonly SecurityRow[] {
  const { passwordSet, biometricKind } = values;
  const rows: SecurityRow[] = [
    { id: "hideBalance", enabled: true },
    { id: "appLock", enabled: true },
  ];

  if (platform === "desktop" && passwordSet) {
    rows.push({ id: "changePassword", enabled: true }, { id: "autoLock", enabled: true });
  }
  if (platform === "mobile" && biometricKind !== null) {
    rows.push({ id: "biometrics", enabled: passwordSet });
  }

  rows.push({ id: "mevProtection", enabled: true });
  return rows;
}
