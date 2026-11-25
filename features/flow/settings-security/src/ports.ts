import type { SettingsPort } from "@features/flow-settings";
import type { AppLockAction, SecuritySettingsValues, SecurityUpdate } from "./types";

/** What a change of a Security setting does in the app. One method per setting. */
export type SecuritySideEffects = Readonly<{
  setHideBalance(value: boolean): void;
  setMevProtection(value: boolean): void;
  setAutoLockTimeout(timeout: number): void;
}>;

/**
 * The port the app provides to the Security section: its values, its changes, and the two things
 * only the app can start, a password flow and the MEV protection page.
 */
export type SecuritySettingsPort = SettingsPort<SecuritySettingsValues, SecurityUpdate> &
  Readonly<{
    requestAppLock(action: AppLockAction): void;
    openMevProtectionInfo(): void;
  }>;
