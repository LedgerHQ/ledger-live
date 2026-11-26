import type { BiometricsKind } from "@features/platform-app-lock";
import type { AppLockAction, SecuritySettingsValues } from "@features/flow-settings-security";

/**
 * What the App lock contributes to the Security section: the password and biometrics state, and
 * what changing them does. One implementation per App lock version, as the legacy screens did.
 */
export type AppLockAdapter = Readonly<
  Pick<
    SecuritySettingsValues,
    "passwordSet" | "biometricKind" | "biometricsEnabled" | "biometricsRequirePassword"
  > & {
    requestAppLock(action: AppLockAction): void;
    setBiometricsEnabled(value: boolean): void;
  }
>;

type Refusal = Readonly<{ isOpen: boolean; onClose: () => void }>;

/** The sheets that explain why the last protection cannot be removed while a card is in use. */
export type ProtectionRefusals = Readonly<{
  password: Refusal;
  biometrics: Refusal & Readonly<{ kind: BiometricsKind | undefined }>;
}>;
