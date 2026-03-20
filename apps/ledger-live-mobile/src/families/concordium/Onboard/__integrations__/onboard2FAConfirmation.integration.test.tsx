/* eslint-disable i18next/no-literal-string */
import React from "react";
import { Linking } from "react-native";
import { act, screen, render, waitFor } from "@tests/test-renderer";
import { server } from "@tests/server";
import OnboardScreen from "../OnboardScreen";
import {
  SESSION_TOPIC,
  TEST_PUBLIC_KEY,
  TEST_SIGNATURE,
  TEST_SERIALIZED_CDT,
  overrideInitialState,
  concordiumHandlers,
} from "./testUtils";
import {
  createDeferred,
  mockGetPublicKey,
  mockSignCredentialDeployment,
  mockRequestCreateAccount,
  mockParentNavigate,
  setupSuccessfulPairing,
} from "./testMockSetup";

/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock(
  "@ledgerhq/coin-concordium/network/walletConnect",
  () => require("./testMockSetup").walletConnectModule,
);
jest.mock("@ledgerhq/coin-concordium/signer", () => require("./testMockSetup").signerModule);
jest.mock("@ledgerhq/live-common/bridge/index", () =>
  require("./testMockSetup").createBridgeModule(),
);
jest.mock("react-native-qrcode-svg", () => require("./testMockSetup").MockQRCode);
jest.mock("@react-navigation/native", () => require("./testMockSetup").createNavigationModule());
/* eslint-enable @typescript-eslint/no-require-imports */

const ID_APP_SUCCESS_RESPONSE = {
  status: "success" as const,
  message: {
    serializedCredentialDeploymentTransaction: TEST_SERIALIZED_CDT,
    identityIndex: 0,
    credNumber: 0,
    accountAddress: "completed_address",
  },
};

type IdAppResponse =
  | typeof ID_APP_SUCCESS_RESPONSE
  | { status: "error"; message: { details: string } };

// ── Test ──

describe("Concordium onboarding 2FA confirmation code", () => {
  let pairing: ReturnType<typeof setupSuccessfulPairing>;

  beforeEach(() => {
    jest.clearAllMocks();
    server.use(...concordiumHandlers);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    pairing = setupSuccessfulPairing();
  });

  function setupPendingAccountCreation() {
    const accountCreation = createDeferred<IdAppResponse>();
    mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
    mockRequestCreateAccount.mockImplementation(() => accountCreation.promise);
    return accountCreation;
  }

  async function advanceToCreateStep(user: ReturnType<typeof render>["user"]) {
    await user.press(screen.getByRole("button", { name: /agree/i }));
    pairing.resolveApproval();
    await waitFor(() => {
      expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeOnTheScreen();
    });
    await user.press(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(screen.getByText("Add Concordium Account")).toBeOnTheScreen();
    });
  }

  async function advanceToConfirmationCode(user: ReturnType<typeof render>["user"]) {
    await advanceToCreateStep(user);
    // Confirmation code only visible while requestCreateAccount is pending (PREPARING state)
    await waitFor(() => {
      expect(screen.getByText(SESSION_TOPIC[0].toUpperCase())).toBeOnTheScreen();
    });
  }

  it("should display all confirmation code digits from session topic", async () => {
    setupPendingAccountCreation();

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToConfirmationCode(user);

    // All 4 digits of confirmation code derived from session topic
    expect(screen.getByText(SESSION_TOPIC[0].toUpperCase())).toBeOnTheScreen();
    expect(screen.getByText(SESSION_TOPIC[1].toUpperCase())).toBeOnTheScreen();
    expect(screen.getByText(SESSION_TOPIC[2].toUpperCase())).toBeOnTheScreen();
    expect(screen.getByText(SESSION_TOPIC[3].toUpperCase())).toBeOnTheScreen();
    expect(
      screen.getByText("To create an account, match the code below in the Concordium ID App"),
    ).toBeOnTheScreen();
  });

  it("should show resend countdown during confirmation", async () => {
    setupPendingAccountCreation();

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToConfirmationCode(user);

    // Countdown visible, resend button not yet available
    expect(screen.getByText(/Resend available in \d+s/)).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: /resend confirmation/i })).not.toBeOnTheScreen();
  });

  it("should show resend button after countdown expires", async () => {
    setupPendingAccountCreation();

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToConfirmationCode(user);

    // Advance fake timers past the 10s countdown
    await act(() => {
      jest.advanceTimersByTime(10_000);
    });

    // Resend button now visible, countdown gone
    expect(screen.getByRole("button", { name: /resend confirmation/i })).toBeOnTheScreen();
    expect(screen.queryByText(/Resend available in \d+s/)).not.toBeOnTheScreen();
  });

  it("should restart account creation when resend is pressed", async () => {
    // First requestCreateAccount: hangs (IDApp doesn't respond)
    const firstAttempt = createDeferred<typeof ID_APP_SUCCESS_RESPONSE>();
    mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
    mockRequestCreateAccount.mockImplementationOnce(() => firstAttempt.promise);

    // Second requestCreateAccount (after resend): succeeds
    const secondAttempt = createDeferred<typeof ID_APP_SUCCESS_RESPONSE>();
    mockRequestCreateAccount.mockImplementationOnce(() => secondAttempt.promise);
    mockSignCredentialDeployment.mockResolvedValue(TEST_SIGNATURE);

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToConfirmationCode(user);

    // Wait for resend to become available
    await act(() => {
      jest.advanceTimersByTime(10_000);
    });

    await user.press(screen.getByRole("button", { name: /resend confirmation/i }));

    // Confirmation code still visible (same session topic)
    await waitFor(() => {
      expect(screen.getByText(SESSION_TOPIC[0].toUpperCase())).toBeOnTheScreen();
    });

    // requestCreateAccount called twice: initial + resend
    expect(mockRequestCreateAccount).toHaveBeenCalledTimes(2);

    // Second attempt succeeds → flow completes
    secondAttempt.resolve(ID_APP_SUCCESS_RESPONSE);

    await waitFor(() => {
      expect(
        screen.getByText("Your Concordium account has been created successfully."),
      ).toBeOnTheScreen();
    });
  });

  describe("2FA failures", () => {
    it("should show error when IDApp rejects the confirmation", async () => {
      const accountCreation = setupPendingAccountCreation();

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToConfirmationCode(user);

      // IDApp rejects the confirmation code
      accountCreation.resolve({
        status: "error",
        message: { details: "User rejected the request" },
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
      });
      expect(screen.getByRole("button", { name: /retry/i })).toBeOnTheScreen();
    });

    it("should recover via retry after IDApp rejection", async () => {
      const firstAttempt = createDeferred<IdAppResponse>();
      const secondAttempt = createDeferred<IdAppResponse>();
      mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
      mockRequestCreateAccount
        .mockImplementationOnce(() => firstAttempt.promise)
        .mockImplementation(() => secondAttempt.promise);
      mockSignCredentialDeployment.mockResolvedValue(TEST_SIGNATURE);

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToConfirmationCode(user);

      // IDApp rejects
      firstAttempt.resolve({
        status: "error",
        message: { details: "User rejected the request" },
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
      });

      await user.press(screen.getByRole("button", { name: /retry/i }));

      // Back to confirmation code on retry
      await waitFor(() => {
        expect(screen.getByText(SESSION_TOPIC[0].toUpperCase())).toBeOnTheScreen();
        expect(
          screen.getByText("To create an account, match the code below in the Concordium ID App"),
        ).toBeOnTheScreen();
      });

      // IDApp accepts on second attempt
      secondAttempt.resolve(ID_APP_SUCCESS_RESPONSE);

      await waitFor(() => {
        expect(
          screen.getByText("Your Concordium account has been created successfully."),
        ).toBeOnTheScreen();
      });
    });

    it("should recover after resend followed by IDApp rejection", async () => {
      const firstAttempt = createDeferred<IdAppResponse>();
      const secondAttempt = createDeferred<IdAppResponse>();
      const thirdAttempt = createDeferred<IdAppResponse>();
      mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
      mockRequestCreateAccount
        .mockImplementationOnce(() => firstAttempt.promise)
        .mockImplementationOnce(() => secondAttempt.promise)
        .mockImplementation(() => thirdAttempt.promise);
      mockSignCredentialDeployment.mockResolvedValue(TEST_SIGNATURE);

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToConfirmationCode(user);

      // IDApp doesn't respond → wait for resend
      await act(() => {
        jest.advanceTimersByTime(10_000);
      });
      await user.press(screen.getByRole("button", { name: /resend confirmation/i }));

      // IDApp rejects on second attempt
      secondAttempt.resolve({
        status: "error",
        message: { details: "Code mismatch" },
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
      });

      // Retry after rejection
      await user.press(screen.getByRole("button", { name: /retry/i }));

      // Back to confirmation code
      await waitFor(() => {
        expect(screen.getByText(SESSION_TOPIC[0].toUpperCase())).toBeOnTheScreen();
      });

      // IDApp accepts on third attempt
      thirdAttempt.resolve(ID_APP_SUCCESS_RESPONSE);

      await waitFor(() => {
        expect(
          screen.getByText("Your Concordium account has been created successfully."),
        ).toBeOnTheScreen();
      });
    });

    it("should recover after multiple consecutive IDApp rejections", async () => {
      const firstAttempt = createDeferred<IdAppResponse>();
      const secondAttempt = createDeferred<IdAppResponse>();
      const thirdAttempt = createDeferred<IdAppResponse>();
      mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
      mockRequestCreateAccount
        .mockImplementationOnce(() => firstAttempt.promise)
        .mockImplementationOnce(() => secondAttempt.promise)
        .mockImplementation(() => thirdAttempt.promise);
      mockSignCredentialDeployment.mockResolvedValue(TEST_SIGNATURE);

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToConfirmationCode(user);

      // First rejection
      firstAttempt.resolve({
        status: "error",
        message: { details: "First rejection" },
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
      });

      await user.press(screen.getByRole("button", { name: /retry/i }));

      // Second rejection
      secondAttempt.resolve({
        status: "error",
        message: { details: "Second rejection" },
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
      });

      await user.press(screen.getByRole("button", { name: /retry/i }));

      // Third attempt succeeds
      thirdAttempt.resolve(ID_APP_SUCCESS_RESPONSE);

      await waitFor(() => {
        expect(
          screen.getByText("Your Concordium account has been created successfully."),
        ).toBeOnTheScreen();
      });

      await user.press(screen.getByRole("button", { name: /continue/i }));

      expect(mockParentNavigate).toHaveBeenCalledWith(
        "AddAccounts",
        expect.objectContaining({
          screen: "AddAccountsSuccess",
        }),
      );
    });
  });

  it("should complete full flow after resend", async () => {
    // First requestCreateAccount: hangs
    const firstAttempt = createDeferred<typeof ID_APP_SUCCESS_RESPONSE>();
    mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
    mockRequestCreateAccount.mockImplementationOnce(() => firstAttempt.promise);

    // Second requestCreateAccount (after resend): succeeds
    const secondAttempt = createDeferred<typeof ID_APP_SUCCESS_RESPONSE>();
    mockRequestCreateAccount.mockImplementationOnce(() => secondAttempt.promise);

    const signing = createDeferred<string>();
    mockSignCredentialDeployment.mockImplementation(() => signing.promise);

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToConfirmationCode(user);

    // Wait for resend, press it
    await act(() => {
      jest.advanceTimersByTime(10_000);
    });
    await user.press(screen.getByRole("button", { name: /resend confirmation/i }));

    // IDApp responds on second attempt
    secondAttempt.resolve(ID_APP_SUCCESS_RESPONSE);

    await waitFor(() => {
      expect(
        screen.getByText("Approve the transaction on your Ledger device. Keep your Ledger nearby."),
      ).toBeOnTheScreen();
    });

    // Device signs
    signing.resolve(TEST_SIGNATURE);

    await waitFor(() => {
      expect(
        screen.getByText("Your Concordium account has been created successfully."),
      ).toBeOnTheScreen();
    });

    await user.press(screen.getByRole("button", { name: /continue/i }));

    expect(mockParentNavigate).toHaveBeenCalledWith(
      "AddAccounts",
      expect.objectContaining({
        screen: "AddAccountsSuccess",
      }),
    );
  });
});
