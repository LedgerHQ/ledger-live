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
 * rows are hidden while no password is set. Biometrics is disabled while no password is set only
 * where biometrics needs one (the legacy App lock).
 */
export function getSecurityRows(
  values: Pick<
    SecuritySettingsValues,
    "passwordSet" | "biometricKind" | "biometricsRequirePassword"
  >,
  platform: SecurityPlatform,
): readonly SecurityRow[] {
  const { passwordSet, biometricKind, biometricsRequirePassword } = values;
  const rows: SecurityRow[] = [
    { id: "hideBalance", enabled: true },
    { id: "appLock", enabled: true },
  ];

  if (platform === "desktop" && passwordSet) {
    rows.push({ id: "changePassword", enabled: true }, { id: "autoLock", enabled: true });
  }
  if (platform === "mobile" && biometricKind !== null) {
    rows.push({ id: "biometrics", enabled: passwordSet || !biometricsRequirePassword });
  }

  rows.push({ id: "mevProtection", enabled: true });
  return rows;
}
