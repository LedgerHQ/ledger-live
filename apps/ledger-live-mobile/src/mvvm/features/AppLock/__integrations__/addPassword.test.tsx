import { PasswordDraftProvider, usePasswordDraft } from "@features/flow-app-lock";
import { render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { ConfirmPasswordScreen } from "../screens/ConfirmPassword";
import { SetupPasswordScreen } from "../screens/SetupPassword";

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(3)),
}));

jest.mock("../adapters/passwordDigest", () => ({
  APP_LOCK_SALT_LENGTH: 16,
  APP_LOCK_SCRYPT_PARAMS: { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 32 },
  derivePasswordDigest: jest.fn(async () => new Uint8Array(32).fill(9)),
  serialiseDerivation: <T,>(run: () => Promise<T>) => run(),
}));

jest.mock("../adapters/verifierStore", () => ({
  writePasswordVerifier: jest.fn(async () => undefined),
}));

const { writePasswordVerifier } = jest.requireMock("../adapters/verifierStore");

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

    await waitFor(() => expect(writePasswordVerifier).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(store.getState().appLock.hasPassword).toBe(true));
  });

  it("says so in place when the two entries differ", async () => {
    const { user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, "somethingelse");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(await screen.findByText("Passwords don't match")).toBeVisible();
    await waitFor(() => expect(writePasswordVerifier).not.toHaveBeenCalled());
  });
});
