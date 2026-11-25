import type { UpdateOf } from "@features/flow-settings";

export type BiometricKind = "faceId" | "touchId" | "biometrics";

/** What the Security section reads. */
export type SecuritySettingsValues = Readonly<{
  hideBalance: boolean;
  mevProtection: boolean;
  /** Whether the app asks for a password to open. */
  passwordSet: boolean;
  /** Minutes of inactivity before the app locks, `-1` for never. */
  autoLockTimeout: number;
  /** The biometrics the device offers, `null` when it has none. */
  biometricKind: BiometricKind | null;
}>;

/** What the Security section can change through `setValue`. The password has its own flows. */
export type EditableSecuritySettings = Pick<
  SecuritySettingsValues,
  "hideBalance" | "mevProtection" | "autoLockTimeout"
>;

export type SecurityUpdate = UpdateOf<EditableSecuritySettings>;

/** The password flow the app starts, the same ones as today. */
export type AppLockAction = "set" | "change" | "remove";
