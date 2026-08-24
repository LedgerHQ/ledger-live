import { act, render, screen } from "@tests/test-renderer";
import React from "react";
import { AppState, type AppStateStatus } from "react-native";
import { UnlockScreen } from "../screens/Unlock";

jest.mock("../adapters/biometrics", () => ({
  promptBiometrics: jest.fn(async () => ({ status: "succeeded" })),
}));

jest.mock("../adapters/passwordVerification", () => ({
  checkPassword: jest.fn(async () => ({ status: "correct" })),
}));

const { promptBiometrics } = jest.requireMock("../adapters/biometrics");

describe("biometric unlock", () => {
  let listeners: ((state: AppStateStatus) => void)[] = [];

  const becomeActive = () =>
    act(() => {
      Object.assign(AppState, { currentState: "active" });
      listeners.forEach(listener => listener("active"));
    });

  beforeEach(() => {
    listeners = [];
    promptBiometrics.mockClear();
    Object.assign(AppState, { currentState: "background" });
    jest.spyOn(AppState, "addEventListener").mockImplementation(((
      _type: string,
      listener: (state: AppStateStatus) => void,
    ) => {
      listeners.push(listener);
      return { remove: jest.fn() };
    }) as typeof AppState.addEventListener);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.assign(AppState, { currentState: "active" });
  });

  const renderUnlock = () =>
    render(<UnlockScreen />, {
      overrideInitialState: state => ({
        ...state,
        appLock: {
          hasPassword: true,
          biometricsEnabled: true,
          isLocked: true,
          needsLongerPassword: false,
        },
      }),
    });

  it("does not prompt while the app is in the background", async () => {
    const { store } = renderUnlock();

    expect(await screen.findByTestId("app-lock-unlock-screen")).toBeVisible();
    expect(promptBiometrics).not.toHaveBeenCalled();
    expect(store.getState().appLock.isLocked).toBe(true);
  });

  it("prompts once the app comes back to the foreground", async () => {
    const { store } = renderUnlock();

    becomeActive();

    expect(promptBiometrics).toHaveBeenCalledTimes(1);
    await act(async () => {});
    expect(store.getState().appLock.isLocked).toBe(false);
  });

  it("falls back to the password field when the prompt is refused", async () => {
    promptBiometrics.mockResolvedValueOnce({ status: "failed" });

    const { store } = renderUnlock();

    becomeActive();
    await act(async () => {});

    expect(await screen.findByTestId("app-lock-unlock-field")).toBeVisible();
    expect(store.getState().appLock.isLocked).toBe(true);
  });

  it("does not prompt again while a prompt is already open", async () => {
    promptBiometrics.mockImplementationOnce(() => new Promise(() => {}));

    renderUnlock();

    becomeActive();
    becomeActive();

    expect(promptBiometrics).toHaveBeenCalledTimes(1);
  });
});
