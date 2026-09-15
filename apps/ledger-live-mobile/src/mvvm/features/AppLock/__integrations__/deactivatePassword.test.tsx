import { act, render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { DeactivatePasswordScreen } from "../screens/DeactivatePassword";

jest.mock("../adapters/passwordDigest", () => ({
  derivePasswordDigest: jest.fn(async (password: string) =>
    password === "longenough" ? Uint8Array.from([10, 20, 30, 40]) : Uint8Array.from([9, 9, 9, 9]),
  ),
  serialiseDerivation: <T,>(run: () => Promise<T>) => run(),
}));

jest.mock("../adapters/verifierStore", () => ({
  readPasswordVerifier: jest.fn(async () => ({
    version: 1,
    scrypt: { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 4 },
    salt: Uint8Array.from([1, 2, 3, 4]),
    digest: Uint8Array.from([10, 20, 30, 40]),
  })),
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

const { derivePasswordDigest } = jest.requireMock("../adapters/passwordDigest");
const { readPasswordVerifier, clearPasswordVerifier } = jest.requireMock(
  "../adapters/verifierStore",
);

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
    const { store, user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, "wrong");
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    expect(await screen.findByText("Incorrect password")).toBeVisible();
    await waitFor(() => expect(clearPasswordVerifier).not.toHaveBeenCalled());
    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("destroys the verifier once the password is proven", async () => {
    const { store, user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    await waitFor(() => expect(clearPasswordVerifier).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(store.getState().appLock.hasPassword).toBe(false));
  });

  it("asks for focus on mount, so the keyboard comes up with the screen", async () => {
    renderDeactivate();

    expect(await screen.findByTestId("app-lock-deactivate-password-field")).toHaveProp(
      "autoFocus",
      true,
    );
  });

  it("locks the CTA while the digest is being derived", async () => {
    let release = (_: Uint8Array) => {};
    derivePasswordDigest.mockImplementationOnce(
      () =>
        new Promise<Uint8Array>(resolve => {
          release = resolve;
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
      release(Uint8Array.from([10, 20, 30, 40]));
    });

    await waitFor(() => expect(clearPasswordVerifier).toHaveBeenCalledTimes(1));
  });

  it("drops a previous failure once the user types again", async () => {
    readPasswordVerifier.mockRejectedValueOnce(new Error("keychain unavailable"));

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
    readPasswordVerifier.mockRejectedValueOnce(new Error("keychain unavailable"));

    const { store, user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    // A failed read must not read as a wrong password, and must leave the lock in place.
    expect(
      await screen.findByText("We couldn't deactivate your password. Please try again."),
    ).toBeVisible();
    expect(store.getState().appLock.hasPassword).toBe(true);
  });
});
