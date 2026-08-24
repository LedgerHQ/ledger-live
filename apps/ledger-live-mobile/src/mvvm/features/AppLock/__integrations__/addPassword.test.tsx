import { PasswordDraftProvider, usePasswordDraft } from "@features/flow-app-lock";
import { render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { ConfirmPasswordScreen } from "../screens/ConfirmPassword";
import { SetupPasswordScreen } from "../screens/SetupPassword";

const PASSWORD = "longenough";

function ChosenPassword({
  password,
  children,
}: Readonly<{ password: string; children: React.ReactNode }>): React.JSX.Element {
  usePasswordDraft().write(password);

  return <>{children}</>;
}

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

  it("accepts an entry that matches the one chosen in the step before", async () => {
    const { user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, PASSWORD);

    await waitFor(() =>
      expect(screen.getByTestId("app-lock-confirm-password-confirm")).toBeEnabled(),
    );
    expect(screen.queryByText("Passwords don't match")).toBeNull();
  });

  it("says so in place when the two entries differ", async () => {
    const { user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, "somethingelse");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(await screen.findByText("Passwords don't match")).toBeVisible();
    expect(screen.getByTestId("app-lock-confirm-password-field")).toBeVisible();
  });
});
