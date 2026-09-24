import { PasswordDraftProvider, usePasswordDraft } from "@features/flow-app-lock";
import { render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { ConfirmPasswordScreen } from "../screens/ConfirmPassword";
import { SetupPasswordScreen } from "../screens/SetupPassword";

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(3)),
}));

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  storeNewPassword: jest.fn(async () => undefined),
}));

const { storeNewPassword } = jest.requireMock("@features/platform-app-lock");

const PASSWORD = "longenough";

function ChosenPassword({
  password,
  children,
}: Readonly<{ password: string; children: React.ReactNode }>): React.JSX.Element {
  usePasswordDraft().write(password);

  return <>{children}</>;
}

beforeEach(() => jest.clearAllMocks());

describe("choosing a password", () => {
  it("only offers to continue once the minimum is met", async () => {
    const { user } = render(
      <PasswordDraftProvider>
        <SetupPasswordScreen />
      </PasswordDraftProvider>,
    );

    const field = await screen.findByTestId("app-lock-setup-password-field");
    const cta = screen.getByTestId("app-lock-setup-password-continue");

    expect(cta).toBeDisabled();

    await user.type(field, "short");
    await waitFor(() => expect(cta).toBeDisabled());

    await user.clear(field);
    await user.type(field, PASSWORD);
    await waitFor(() => expect(cta).toBeEnabled());
  });
});

describe("confirming a password", () => {
  const renderConfirm = () =>
    render(
      <PasswordDraftProvider>
        <ChosenPassword password={PASSWORD}>
          <ConfirmPasswordScreen />
        </ChosenPassword>
      </PasswordDraftProvider>,
    );

  it("stores a verifier once both entries agree", async () => {
    const { store, user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    await waitFor(() => expect(storeNewPassword).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(store.getState().appLock.hasPassword).toBe(true));
  });

  it("says so in place when the two entries differ", async () => {
    const { user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, "somethingelse");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(await screen.findByText("Passwords don't match")).toBeVisible();
    await waitFor(() => expect(storeNewPassword).not.toHaveBeenCalled());
  });

  it("drops a previous save failure once the user types again", async () => {
    storeNewPassword.mockRejectedValueOnce(new Error("keychain unavailable"));

    const { user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(
      await screen.findByText("We couldn't save your password. Please try again."),
    ).toBeVisible();

    await user.clear(field);
    await user.type(field, "somethingelse");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(await screen.findByText("Passwords don't match")).toBeVisible();
  });
});
