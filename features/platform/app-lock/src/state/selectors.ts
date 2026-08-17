import { getAuthenticationType, isAppLockConfigured } from "./authenticationType";
import type { AppLockState, AuthenticationType } from "./types";

export type WithAppLock = {
  appLock: AppLockState;
};

export function selectAppLock(state: WithAppLock): AppLockState {
  return state.appLock;
}

export function selectHasPassword(state: WithAppLock): boolean {
  return selectAppLock(state).hasPassword;
}

export function selectBiometricsEnabled(state: WithAppLock): boolean {
  return selectAppLock(state).biometricsEnabled;
}

export function selectIsLocked(state: WithAppLock): boolean {
  return selectAppLock(state).isLocked;
}

export function selectAuthenticationType(state: WithAppLock): AuthenticationType {
  return getAuthenticationType(selectAppLock(state));
}

export function selectIsAppLockConfigured(state: WithAppLock): boolean {
  return isAppLockConfigured(selectAppLock(state));
}
