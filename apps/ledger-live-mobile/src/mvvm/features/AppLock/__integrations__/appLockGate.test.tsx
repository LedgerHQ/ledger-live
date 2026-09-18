import { unlockApp } from "@features/platform-app-lock";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { AppState, Platform, Text, type AppStateStatus } from "react-native";
import { AppLockGate } from "../AppLockGate";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  hasPasswordVerifier: jest.fn(async () => false),
  hasBiometricsMarker: jest.fn(async () => false),
  clearStoredPassword: jest.fn(async () => undefined),
  clearBiometricsMarker: jest.fn(async () => undefined),
  checkPassword: jest.fn(async () => ({ status: "incorrect" })),
  promptBiometrics: jest.fn(async () => ({ status: "failed" })),
}));

const { hasPasswordVerifier, hasBiometricsMarker, clearStoredPassword, checkPassword } =
  jest.requireMock("@features/platform-app-lock");

jest.mock("../adapters/installMarker", () => ({
  hasKnownInstall: jest.fn(),
  writeInstallMarker: jest.fn(async () => undefined),
}));

const { hasKnownInstall, writeInstallMarker } = jest.requireMock("../adapters/installMarker");

let appStateSpy: jest.SpyInstance | undefined;

const APP_CONTENT = "portfolio";
const UNLOCK_SCREEN = "app-lock-unlock-screen";

const renderGate = () => {
  const listeners: ((state: AppStateStatus) => void)[] = [];

  appStateSpy = jest.spyOn(AppState, "addEventListener").mockImplementation(((
    _type: string,
    listener: (state: AppStateStatus) => void,
  ) => {
    listeners.push(listener);
    return { remove: jest.fn() };
  }) as typeof AppState.addEventListener);

  const rendered = render(
    <AppLockGate>
      <Text>{APP_CONTENT}</Text>
    </AppLockGate>,
  );

  return {
    ...rendered,
    background: () =>
      act(() => {
        Object.assign(AppState, { currentState: "background" });
        listeners.forEach(listener => listener("background"));
      }),
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  // Implementations survive clearAllMocks, so each case would otherwise inherit whatever the
  // previous one last set on these two reads.
  hasPasswordVerifier.mockResolvedValue(false);
  hasBiometricsMarker.mockResolvedValue(false);
  hasKnownInstall.mockResolvedValue(true);
  Object.assign(AppState, { currentState: "active" });
});

afterEach(() => {
  // Not restoreAllMocks: it would undo the jest setup's own spies for every later test.
  appStateSpy?.mockRestore();
  appStateSpy = undefined;
  Object.assign(Platform, { OS: "android" });
});

describe("the app lock gate", () => {
  it("leaves an unprotected app alone", async () => {
    renderGate();

    expect(await screen.findByText(APP_CONTENT)).toBeVisible();
    await waitFor(() => expect(screen.queryByTestId(UNLOCK_SCREEN)).toBeNull());
  });

  it("locks a protected app on boot, keeping it mounted but out of reach", async () => {
    hasPasswordVerifier.mockResolvedValue(true);

    renderGate();

    expect(await screen.findByTestId(UNLOCK_SCREEN)).toBeVisible();
    expect(screen.getByText(APP_CONTENT, { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText(APP_CONTENT)).toBeNull();
  });

  it("locks an app protected by biometrics alone, read back at boot", async () => {
    hasBiometricsMarker.mockResolvedValue(true);

    const { store } = renderGate();

    expect(await screen.findByTestId(UNLOCK_SCREEN)).toBeVisible();
    expect(store.getState().appLock.biometricsEnabled).toBe(true);
    expect(store.getState().appLock.hasPassword).toBe(false);
  });

  // iOS keeps keychain items when the app is deleted, so a reinstall found the previous protection
  // and demanded it — for data that went with the uninstall, and with no way back for an owner who
  // had forgotten the password.
  it("opens an app whose protection outlived its install, and destroys it", async () => {
    hasPasswordVerifier.mockResolvedValue(true);
    hasBiometricsMarker.mockResolvedValue(true);
    hasKnownInstall.mockResolvedValue(false);

    const { store } = renderGate();

    expect(await screen.findByText(APP_CONTENT)).toBeVisible();
    expect(clearStoredPassword).toHaveBeenCalled();
    expect(store.getState().appLock.hasPassword).toBe(false);
    expect(store.getState().appLock.biometricsEnabled).toBe(false);
  });

  it("marks the install, so the next launch keeps the protection it finds", async () => {
    hasPasswordVerifier.mockResolvedValue(true);

    const { store } = renderGate();

    await screen.findByTestId(UNLOCK_SCREEN);

    expect(writeInstallMarker).toHaveBeenCalled();
    expect(clearStoredPassword).not.toHaveBeenCalled();
    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("treats a keychain that will not answer as protected", async () => {
    hasPasswordVerifier.mockRejectedValue(new Error("keychain unavailable"));

    const { store } = renderGate();

    expect(await screen.findByTestId(UNLOCK_SCREEN)).toBeVisible();
    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("withholds the app until the read answers", async () => {
    let release = (_: boolean) => {};
    hasPasswordVerifier.mockImplementation(
      () =>
        new Promise<boolean>(resolve => {
          release = resolve;
        }),
    );

    renderGate();

    await waitFor(() => expect(screen.queryByText(APP_CONTENT)).toBeNull());

    await act(async () => {
      release(false);
    });

    expect(await screen.findByText(APP_CONTENT)).toBeVisible();
  });

  it("never paints the app on a protected start", async () => {
    hasPasswordVerifier.mockResolvedValue(true);

    renderGate();

    await screen.findByTestId(UNLOCK_SCREEN);
    expect(screen.queryByText(APP_CONTENT)).toBeNull();
  });

  it("locks when the app goes to the background", async () => {
    hasPasswordVerifier.mockResolvedValue(true);

    const { store, background } = renderGate();

    await screen.findByTestId(UNLOCK_SCREEN);

    await act(async () => {
      store.dispatch(unlockApp());
    });
    await waitFor(() => expect(store.getState().appLock.isLocked).toBe(false));

    background();

    expect(store.getState().appLock.isLocked).toBe(true);
  });

  // The unlock screen dispatches on a successful check without knowing the app was backgrounded
  // meanwhile; the lock has to survive that, and it is this effect that makes it.
  it("re-locks an unlock that lands while the app is backgrounded", async () => {
    hasPasswordVerifier.mockResolvedValue(true);

    let release = (_: { status: string }) => {};
    checkPassword.mockImplementation(
      () =>
        new Promise(resolve => {
          release = resolve;
        }),
    );

    const { store, background, user } = renderGate();

    await screen.findByTestId(UNLOCK_SCREEN);
    await user.type(screen.getByTestId("app-lock-unlock-field"), "longenough");
    await user.press(screen.getByTestId("app-lock-unlock-submit"));

    background();

    await act(async () => {
      release({ status: "correct" });
    });

    expect(store.getState().appLock.isLocked).toBe(true);
  });

  it("ignores the inactive state on iOS, which a biometric prompt causes", async () => {
    hasPasswordVerifier.mockResolvedValue(true);
    Object.assign(Platform, { OS: "ios" });

    const listeners: ((state: AppStateStatus) => void)[] = [];
    appStateSpy = jest.spyOn(AppState, "addEventListener").mockImplementation(((
      _type: string,
      listener: (state: AppStateStatus) => void,
    ) => {
      listeners.push(listener);
      return { remove: jest.fn() };
    }) as typeof AppState.addEventListener);

    const { store } = render(
      <AppLockGate>
        <Text>{APP_CONTENT}</Text>
      </AppLockGate>,
    );

    await screen.findByTestId(UNLOCK_SCREEN);
    await act(async () => {
      store.dispatch(unlockApp());
    });

    act(() => listeners.forEach(listener => listener("inactive")));

    expect(store.getState().appLock.isLocked).toBe(false);
  });
});
