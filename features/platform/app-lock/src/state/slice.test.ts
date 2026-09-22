import {
  appLockInitialState,
  appLockSlice,
  hydrateAppLock,
  lockApp,
  resetAppLock,
  setBiometricsEnabled,
  setHasPassword,
  setNeedsLongerPassword,
  unlockApp,
} from "./slice";

const reduce = appLockSlice.reducer;

describe("appLockSlice", () => {
  it("starts unprotected and unlocked", () => {
    expect(reduce(undefined, { type: "@@INIT" })).toEqual({
      isHydrated: false,
      hasPassword: false,
      biometricsEnabled: false,
      isLocked: false,
      needsLongerPassword: false,
    });
  });

  it("sets each protection independently", () => {
    const withPassword = reduce(appLockInitialState, setHasPassword(true));
    expect(withPassword).toEqual({
      isHydrated: true,
      hasPassword: true,
      biometricsEnabled: false,
      isLocked: false,
      needsLongerPassword: false,
    });

    const withBoth = reduce(withPassword, setBiometricsEnabled(true));
    expect(withBoth.biometricsEnabled).toBe(true);
    expect(withBoth.hasPassword).toBe(true);

    expect(reduce(withBoth, setHasPassword(false))).toEqual({
      isHydrated: true,
      hasPassword: false,
      biometricsEnabled: true,
      isLocked: false,
      needsLongerPassword: false,
    });
  });

  it("locks and unlocks without touching the protection flags", () => {
    const configured = reduce(appLockInitialState, setHasPassword(true));

    const locked = reduce(configured, lockApp());
    expect(locked).toEqual({
      isHydrated: true,
      hasPassword: true,
      biometricsEnabled: false,
      isLocked: true,
      needsLongerPassword: false,
    });

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

  it("lets a setup that beat the boot read stand", () => {
    const afterSetup = reduce(undefined, setHasPassword(true));
    const afterLateRead = reduce(
      afterSetup,
      hydrateAppLock({ hasPassword: false, biometricsEnabled: false }),
    );

    expect(afterLateRead.hasPassword).toBe(true);
    expect(afterLateRead.isHydrated).toBe(true);
  });

  it("restores biometrics read back from the keychain", () => {
    const hydrated = reduce(
      undefined,
      hydrateAppLock({ hasPassword: false, biometricsEnabled: true }),
    );

    expect(hydrated.biometricsEnabled).toBe(true);
    expect(hydrated.isHydrated).toBe(true);
  });

  it("hydrates once, ignoring a second read", () => {
    const hydrated = reduce(
      undefined,
      hydrateAppLock({ hasPassword: true, biometricsEnabled: false }),
    );

    expect(
      reduce(hydrated, hydrateAppLock({ hasPassword: false, biometricsEnabled: false }))
        .hasPassword,
    ).toBe(true);
  });

  it("records that the migrated password is too short to keep", () => {
    const migrated = reduce(reduce(undefined, setHasPassword(true)), setNeedsLongerPassword(true));

    expect(migrated.needsLongerPassword).toBe(true);
    expect(reduce(migrated, setNeedsLongerPassword(false)).needsLongerPassword).toBe(false);
  });

  it("releases a lock the removal raced, leaving nothing to unlock it", () => {
    const lockedMidRemoval = reduce(reduce(undefined, setHasPassword(true)), lockApp());

    expect(reduce(lockedMidRemoval, setHasPassword(false)).isLocked).toBe(false);
  });

  it("keeps the lock when biometrics still protects the app", () => {
    const lockedWithBoth = reduce(
      reduce(reduce(undefined, setHasPassword(true)), setBiometricsEnabled(true)),
      lockApp(),
    );

    expect(reduce(lockedWithBoth, setHasPassword(false)).isLocked).toBe(true);
  });

  it("releases a lock when biometrics was the last protection left", () => {
    const lockedOnBiometrics = reduce(reduce(undefined, setBiometricsEnabled(true)), lockApp());

    expect(reduce(lockedOnBiometrics, setBiometricsEnabled(false)).isLocked).toBe(false);
  });
});
