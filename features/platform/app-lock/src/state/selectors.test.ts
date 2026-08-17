import { getAuthenticationType, isAppLockConfigured } from "./authenticationType";
import {
  selectAppLock,
  selectAuthenticationType,
  selectBiometricsEnabled,
  selectHasPassword,
  selectIsAppLockConfigured,
  selectIsLocked,
} from "./selectors";
import type { AppLockState, AuthenticationType } from "./types";

function state(overrides: Partial<AppLockState> = {}): { appLock: AppLockState } {
  return {
    appLock: { hasPassword: false, biometricsEnabled: false, isLocked: false, ...overrides },
  };
}

describe("getAuthenticationType", () => {
  const cases: [boolean, boolean, AuthenticationType][] = [
    [false, false, "none"],
    [true, false, "password"],
    [false, true, "biometrics"],
    [true, true, "passwordAndBiometrics"],
  ];

  it.each(cases)(
    "maps hasPassword=%s biometricsEnabled=%s to %s",
    (hasPassword, biometricsEnabled, expected) => {
      expect(getAuthenticationType({ hasPassword, biometricsEnabled })).toBe(expected);
    },
  );
});

describe("isAppLockConfigured", () => {
  it("is true when either protection is on, so biometrics alone counts", () => {
    expect(isAppLockConfigured({ hasPassword: false, biometricsEnabled: false })).toBe(false);
    expect(isAppLockConfigured({ hasPassword: true, biometricsEnabled: false })).toBe(true);
    expect(isAppLockConfigured({ hasPassword: false, biometricsEnabled: true })).toBe(true);
    expect(isAppLockConfigured({ hasPassword: true, biometricsEnabled: true })).toBe(true);
  });
});

describe("selectors", () => {
  it("read the slice and its flags", () => {
    const root = state({ hasPassword: true, isLocked: true });

    expect(selectAppLock(root)).toBe(root.appLock);
    expect(selectHasPassword(root)).toBe(true);
    expect(selectBiometricsEnabled(root)).toBe(false);
    expect(selectIsLocked(root)).toBe(true);
  });

  it("derive the authentication type and configured-ness", () => {
    expect(selectAuthenticationType(state())).toBe("none");
    expect(selectAuthenticationType(state({ biometricsEnabled: true }))).toBe("biometrics");
    expect(selectIsAppLockConfigured(state())).toBe(false);
    expect(selectIsAppLockConfigured(state({ biometricsEnabled: true }))).toBe(true);
  });
});
