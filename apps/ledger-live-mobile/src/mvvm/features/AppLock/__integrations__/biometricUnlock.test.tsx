import { render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { AppState } from "react-native";
import type { State } from "~/reducers/types";
import { UnlockScreen } from "../screens/Unlock";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  promptBiometrics: jest.fn(),
  checkPassword: jest.fn(async () => ({ status: "incorrect" })),
}));

const { promptBiometrics } = jest.requireMock("@features/platform-app-lock");

const FIELD = "app-lock-unlock-field";
const SCREEN = "app-lock-unlock-screen";

const protectedBy = (protection: Partial<State["appLock"]>) => (state: State) => ({
  ...state,
  appLock: { ...state.appLock, isHydrated: true, isLocked: true, ...protection },
});

beforeEach(() => {
  jest.clearAllMocks();
  // The preset leaves `currentState` as a mock function, so the prompt would never be asked for.
  Object.assign(AppState, { currentState: "active" });
});

describe("unlocking with biometrics", () => {
  it("asks for biometrics before drawing a field, so the password is the fallback", async () => {
    promptBiometrics.mockResolvedValue({ status: "succeeded" });

    const { store } = render(<UnlockScreen />, {
      overrideInitialState: protectedBy({ hasPassword: true, biometricsEnabled: true }),
    });

    await waitFor(() => expect(store.getState().appLock.isLocked).toBe(false));

    expect(screen.queryByTestId(FIELD)).toBeNull();
  });

  it("reveals the field once a password user refuses biometrics", async () => {
    promptBiometrics.mockResolvedValue({ status: "failed" });

    render(<UnlockScreen />, {
      overrideInitialState: protectedBy({ hasPassword: true, biometricsEnabled: true }),
    });

    expect(await screen.findByTestId(FIELD)).toBeVisible();
  });

  it("never shows a field to a user protected by biometrics alone", async () => {
    promptBiometrics.mockResolvedValue({ status: "failed" });

    const { user } = render(<UnlockScreen />, {
      overrideInitialState: protectedBy({ hasPassword: false, biometricsEnabled: true }),
    });

    expect(await screen.findByTestId(SCREEN)).toBeVisible();
    await waitFor(() => expect(promptBiometrics).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId(FIELD)).toBeNull();

    await user.press(screen.getByTestId(SCREEN));

    await waitFor(() => expect(promptBiometrics).toHaveBeenCalledTimes(2));
    expect(screen.queryByTestId(FIELD)).toBeNull();
  });

  it("asks for nothing when only a password protects the app", async () => {
    render(<UnlockScreen />, {
      overrideInitialState: protectedBy({ hasPassword: true, biometricsEnabled: false }),
    });

    expect(await screen.findByTestId(FIELD)).toBeVisible();
    expect(promptBiometrics).not.toHaveBeenCalled();
  });
});
