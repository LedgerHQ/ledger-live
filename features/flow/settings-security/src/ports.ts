import type { SettingsPort } from "@features/flow-settings";
import type { AppLockAction, SecuritySettingsValues, SecurityUpdate } from "./types";

/** What a change of a Security setting does in the app. One method per setting. */
export type SecuritySideEffects = Readonly<{
  setHideBalance(value: boolean): void;
  setMevProtection(value: boolean): void;
  setAutoLockTimeout(timeout: number): void;
  setBiometricsEnabled(value: boolean): void;
}>;

/**
 * The port the app provides to the Security section: its values, its changes, and the one thing
 * only the app can start, a password flow.
 */
export type SecuritySettingsPort = SettingsPort<SecuritySettingsValues, SecurityUpdate> &
  Readonly<{
    requestAppLock(action: AppLockAction): void;
  }>;
