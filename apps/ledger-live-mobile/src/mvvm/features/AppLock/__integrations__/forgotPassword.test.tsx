import { render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { AppState, Keyboard } from "react-native";
import type { State } from "~/reducers/types";
import { UnlockScreen } from "../screens/Unlock";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  promptBiometrics: jest.fn(async () => ({ status: "failed" })),
  checkPassword: jest.fn(async () => ({ status: "incorrect" })),
}));

const TITLE = "Forgot password";
const DISMISS = "app-lock-forgot-password-dismiss";
const LINK = "app-lock-unlock-forgot-password";
const FIELD = "app-lock-unlock-field";

const lockedWithPassword = (state: State) => ({
  ...state,
  appLock: { ...state.appLock, isHydrated: true, isLocked: true, hasPassword: true },
});

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(AppState, { currentState: "active" });
});

describe("forgetting the password", () => {
  it("answers the link with its copy and its single action", async () => {
    const { user } = render(<UnlockScreen />, { overrideInitialState: lockedWithPassword });

    await user.press(await screen.findByTestId(LINK));

    expect(await screen.findByText(TITLE)).toBeVisible();
    expect(screen.getByTestId(DISMISS)).toBeVisible();
  });

  it("takes the keyboard away, which was sitting in front of the sheet", async () => {
    const dismissKeyboard = jest.spyOn(Keyboard, "dismiss");
    const { user } = render(<UnlockScreen />, { overrideInitialState: lockedWithPassword });

    await screen.findByTestId(LINK);

    expect(dismissKeyboard).not.toHaveBeenCalled();

    await user.press(screen.getByTestId(LINK));

    expect(dismissKeyboard).toHaveBeenCalled();
  });

  it("leaves the app locked, and the field ready, once dismissed", async () => {
    const { store, user } = render(<UnlockScreen />, {
      overrideInitialState: lockedWithPassword,
    });

    await user.press(await screen.findByTestId(LINK));
    await user.press(await screen.findByTestId(DISMISS));

    expect(store.getState().appLock.isLocked).toBe(true);
    expect(screen.getByTestId(FIELD)).toBeVisible();
  });

  it("is absent for a user with no password", async () => {
    render(<UnlockScreen />, {
      overrideInitialState: (state: State) => ({
        ...state,
        appLock: { ...state.appLock, isHydrated: true, isLocked: true, hasPassword: false },
      }),
    });

    await waitFor(() => expect(screen.queryByTestId(LINK)).toBeNull());
  });
});
