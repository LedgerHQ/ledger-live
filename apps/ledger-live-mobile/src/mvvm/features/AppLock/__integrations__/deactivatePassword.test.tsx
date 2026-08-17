import { render, screen } from "@tests/test-renderer";
import React from "react";
import { DeactivatePasswordScreen } from "../screens/DeactivatePassword";

jest.mock("../adapters/verifierStore", () => ({
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

jest.mock("../adapters/passwordVerification", () => ({
  checkPassword: jest.fn(async () => ({ status: "incorrect" })),
}));

const { clearPasswordVerifier } = jest.requireMock("../adapters/verifierStore");
const { checkPassword } = jest.requireMock("../adapters/passwordVerification");

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
    expect(clearPasswordVerifier).not.toHaveBeenCalled();
    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("destroys the verifier once the password is proven", async () => {
    checkPassword.mockResolvedValue({ status: "correct", verifier: { version: 1 } });

    const { store, user } = renderDeactivate();

    const field = await screen.findByTestId("app-lock-deactivate-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-deactivate-password-confirm"));

    expect(clearPasswordVerifier).toHaveBeenCalledTimes(1);
    expect(store.getState().appLock.hasPassword).toBe(false);
  });
});
