import { appLockInitialState } from "@features/platform-app-lock";
import { getAppLockAttributes } from "../getAppLockAttributes";

const stateWith = ({
  hasPassword = false,
  biometricsEnabled = false,
  legacy = { hasPassword: false, biometricsEnabled: false },
}: Readonly<{
  hasPassword?: boolean;
  biometricsEnabled?: boolean;
  legacy?: Readonly<{ hasPassword: boolean; biometricsEnabled: boolean }> | null;
}>) => ({
  appLock: { ...appLockInitialState, isHydrated: true, hasPassword, biometricsEnabled },
  settings: { privacy: legacy },
});

describe("getAppLockAttributes", () => {
  it("reports the revamped protection once the flag is on", () => {
    expect(getAppLockAttributes(stateWith({ hasPassword: true }), true)).toEqual({
      password_enabled: true,
      biometrics_enabled: false,
    });
    expect(getAppLockAttributes(stateWith({ biometricsEnabled: true }), true)).toEqual({
      password_enabled: false,
      biometrics_enabled: true,
    });
  });

  it("reports the revamped protection a user keeps with the flag off", () => {
    expect(getAppLockAttributes(stateWith({ hasPassword: true }), false)).toEqual({
      password_enabled: true,
      biometrics_enabled: false,
    });
  });

  it("reports the legacy protection while the legacy scheme is in use", () => {
    const state = stateWith({ legacy: { hasPassword: true, biometricsEnabled: true } });

    expect(getAppLockAttributes(state, false)).toEqual({
      password_enabled: true,
      biometrics_enabled: true,
    });
  });

  it("ignores a legacy password the revamped scheme cannot read", () => {
    const state = stateWith({ legacy: { hasPassword: true, biometricsEnabled: true } });

    expect(getAppLockAttributes(state, true)).toEqual({
      password_enabled: false,
      biometrics_enabled: false,
    });
  });

  it("reports nothing enabled before any privacy was ever set", () => {
    expect(getAppLockAttributes(stateWith({ legacy: null }), false)).toEqual({
      password_enabled: false,
      biometrics_enabled: false,
    });
  });
});
