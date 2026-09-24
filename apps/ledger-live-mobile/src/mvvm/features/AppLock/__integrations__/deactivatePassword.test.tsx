import { act, render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { DeactivatePasswordScreen } from "../screens/DeactivatePassword";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  clearPasswordIfCorrect: jest.fn(),
}));

const { clearPasswordIfCorrect } = jest.requireMock("@features/platform-app-lock");

const correct = { status: "correct", verifier: { version: 1 } } as const;

const PASSWORD = "longenough";

beforeEach(() => jest.clearAllMocks());

describe("deactivating a password", () => {
  const renderDeactivate = () =>
    render(<DeactivatePasswordScreen />, {
      overrideInitialState: state => ({
        ...state,
        appLock: { ...state.appLock, hasPassword: true },
      }),
    });

  it("refuses a wrong password and keeps the verifier", async () => {
    clearPasswordIfCorrect.mockResolvedValue({ status: "incorrect" });

    const { store, user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, "wrong");
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    expect(await screen.findByText("Incorrect password")).toBeVisible();
    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("destroys the verifier once the password is proven", async () => {
    clearPasswordIfCorrect.mockResolvedValue(correct);

    const { store, user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    await waitFor(() => expect(clearPasswordIfCorrect).toHaveBeenCalledWith(PASSWORD));
    await waitFor(() => expect(store.getState().appLock.hasPassword).toBe(false));
  });

  it("asks for focus on mount, so the keyboard comes up with the screen", async () => {
    clearPasswordIfCorrect.mockResolvedValue(correct);
    renderDeactivate();

    expect(await screen.findByTestId("app-lock-deactivate-password-field")).toHaveProp(
      "autoFocus",
      true,
    );
  });

  it("locks the CTA while the digest is being derived", async () => {
    let release = () => {};
    clearPasswordIfCorrect.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          release = () => resolve(correct);
        }),
    );

    const { user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    await waitFor(() =>
      expect(screen.getByTestId("app-lock-deactivate-password-confirm")).toBeDisabled(),
    );

    await act(async () => {
      release();
    });

    await waitFor(() => expect(clearPasswordIfCorrect).toHaveBeenCalledTimes(1));
  });

  it("drops a previous failure once the user types again", async () => {
    clearPasswordIfCorrect
      .mockRejectedValueOnce(new Error("keychain unavailable"))
      .mockResolvedValue({ status: "incorrect" });

    const { user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    expect(
      await screen.findByText("We couldn't deactivate your password. Please try again."),
    ).toBeVisible();

    await user.clear(field);
    await user.type(field, "wrong");
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    expect(await screen.findByText("Incorrect password")).toBeVisible();
  });

  it("says so in place when the keychain will not give the verifier up", async () => {
    clearPasswordIfCorrect.mockRejectedValueOnce(new Error("keychain unavailable"));

    const { store, user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    expect(
      await screen.findByText("We couldn't deactivate your password. Please try again."),
    ).toBeVisible();
    expect(store.getState().appLock.hasPassword).toBe(true);
  });
});
