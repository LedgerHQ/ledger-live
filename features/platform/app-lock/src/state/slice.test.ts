import {
  appLockInitialState,
  appLockSlice,
  lockApp,
  resetAppLock,
  setBiometricsEnabled,
  setHasPassword,
  unlockApp,
} from "./slice";

const reduce = appLockSlice.reducer;

describe("appLockSlice", () => {
  it("starts unprotected and unlocked", () => {
    expect(reduce(undefined, { type: "@@INIT" })).toEqual({
      hasPassword: false,
      biometricsEnabled: false,
      isLocked: false,
    });
  });

  it("sets each protection independently", () => {
    const withPassword = reduce(appLockInitialState, setHasPassword(true));
    expect(withPassword).toEqual({
      hasPassword: true,
      biometricsEnabled: false,
      isLocked: false,
    });

    const withBoth = reduce(withPassword, setBiometricsEnabled(true));
    expect(withBoth.biometricsEnabled).toBe(true);
    expect(withBoth.hasPassword).toBe(true);

    expect(reduce(withBoth, setHasPassword(false))).toEqual({
      hasPassword: false,
      biometricsEnabled: true,
      isLocked: false,
    });
  });

  it("locks and unlocks without touching the protection flags", () => {
    const configured = reduce(appLockInitialState, setHasPassword(true));

    const locked = reduce(configured, lockApp());
    expect(locked).toEqual({ hasPassword: true, biometricsEnabled: false, isLocked: true });

    expect(reduce(locked, unlockApp()).isLocked).toBe(false);
    expect(reduce(locked, unlockApp()).hasPassword).toBe(true);
  });

  it("returns to the initial state on reset", () => {
    const configured = reduce(
      reduce(reduce(appLockInitialState, setHasPassword(true)), setBiometricsEnabled(true)),
      lockApp(),
    );

    expect(reduce(configured, resetAppLock())).toEqual(appLockInitialState);
  });
});
