import { unlockApp } from "@features/platform-app-lock";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { AppState, Platform, Text, type AppStateStatus } from "react-native";
import { AppLockGate } from "../AppLockGate";

jest.mock("../adapters/verifierStore", () => ({
  readStoredPassword: jest.fn(async () => null),
  hasPasswordVerifier: jest.fn(async () => false),
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

jest.mock("../adapters/biometrics", () => ({
  hasArmedBiometricPrompt: jest.fn(async () => false),
  disarmBiometricPrompt: jest.fn(async () => undefined),
  promptBiometrics: jest.fn(async () => ({ status: "failed" })),
}));

jest.mock("../adapters/installMarker", () => ({
  hasInstallMarker: jest.fn(async () => true),
}));

jest.mock("../adapters/passwordVerification", () => ({
  checkPassword: jest.fn(async () => ({ status: "incorrect" })),
}));

jest.mock("../hooks/useLegacyPasswordMigration", () => ({
  useLegacyPasswordMigration: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(3)),
}));

jest.mock("../adapters/passwordDigest", () => ({
  APP_LOCK_SALT_LENGTH: 16,
  APP_LOCK_SCRYPT_PARAMS: { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 32 },
  derivePasswordDigest: jest.fn(async () => new Uint8Array(32).fill(9)),
  serialiseDerivation: <T,>(run: () => Promise<T>) => run(),
}));

const { readStoredPassword, hasPasswordVerifier } = jest.requireMock("../adapters/verifierStore");

const APP_CONTENT = "portfolio";
const UNLOCK_SCREEN = "app-lock-unlock-screen";

const renderGate = () => {
  const listeners: ((state: AppStateStatus) => void)[] = [];

  jest.spyOn(AppState, "addEventListener").mockImplementation(((
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
  Object.assign(AppState, { currentState: "active" });
});

afterEach(() => {
  jest.restoreAllMocks();
  Object.assign(Platform, { OS: "android" });
});

describe("the app lock gate", () => {
  it("leaves an unprotected app alone", async () => {
    renderGate();

    expect(await screen.findByText(APP_CONTENT)).toBeVisible();
    await waitFor(() => expect(screen.queryByTestId(UNLOCK_SCREEN)).toBeNull());
  });

  it("locks a protected app on boot, without withholding the app below it", async () => {
    readStoredPassword.mockResolvedValue({ verifier: { version: 1 }, needsLongerPassword: false });
    hasPasswordVerifier.mockResolvedValue(true);

    renderGate();

    expect(await screen.findByTestId(UNLOCK_SCREEN)).toBeVisible();
    expect(screen.getByText(APP_CONTENT)).toBeTruthy();
  });

  it("locks when the app goes to the background", async () => {
    readStoredPassword.mockResolvedValue({ verifier: { version: 1 }, needsLongerPassword: false });
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

  it("ignores the inactive state on iOS, which a biometric prompt causes", async () => {
    readStoredPassword.mockResolvedValue({ verifier: { version: 1 }, needsLongerPassword: false });
    hasPasswordVerifier.mockResolvedValue(true);
    Object.assign(Platform, { OS: "ios" });

    const listeners: ((state: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, "addEventListener").mockImplementation(((
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
