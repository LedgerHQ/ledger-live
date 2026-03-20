/* eslint-disable i18next/no-literal-string */
import React from "react";
import { Linking } from "react-native";
import { screen, render, waitFor } from "@tests/test-renderer";
import { server } from "@tests/server";
import OnboardScreen from "../OnboardScreen";
import { WC_RAW_URI, overrideInitialState, concordiumHandlers } from "./testUtils";
import {
  createDeferred,
  mockInitiatePairing,
  mockGetSession,
  mockGetPublicKey,
  mockRequestCreateAccount,
  mockParentNavigate,
  setupSuccessfulPairing,
  setupSuccessfulAccountCreation,
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

// ── Test ──

describe("Concordium onboarding WalletConnect session errors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(...concordiumHandlers);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
  });

  async function goThroughAcknowledgement(user: ReturnType<typeof render>["user"]) {
    await user.press(screen.getByRole("button", { name: /agree/i }));
  }

  async function advanceToPairSuccess(
    user: ReturnType<typeof render>["user"],
    pairing: ReturnType<typeof setupSuccessfulPairing>,
  ) {
    await goThroughAcknowledgement(user);
    pairing.resolveApproval();
    await waitFor(() => {
      expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeOnTheScreen();
    });
  }

  async function advanceToCreateStep(
    user: ReturnType<typeof render>["user"],
    pairing: ReturnType<typeof setupSuccessfulPairing>,
  ) {
    await advanceToPairSuccess(user, pairing);

    await user.press(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText("Add Concordium Account")).toBeOnTheScreen();
    });
  }

  describe("pairing failures", () => {
    it("should show pairing error when initiatePairing rejects", async () => {
      mockInitiatePairing.mockRejectedValue(new Error("Network error"));

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await goThroughAcknowledgement(user);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to connect to Concordium ID App. Please try again."),
        ).toBeOnTheScreen();
      });
      expect(screen.getByRole("button", { name: /retry/i })).toBeOnTheScreen();
    });

    it("should show pairing error when session approval times out", async () => {
      mockInitiatePairing.mockResolvedValue({
        uri: WC_RAW_URI,
        approval: jest.fn(() => Promise.reject(new Error("Approval timed out"))),
      });

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await goThroughAcknowledgement(user);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to connect to Concordium ID App. Please try again."),
        ).toBeOnTheScreen();
      });
      expect(screen.getByRole("button", { name: /retry/i })).toBeOnTheScreen();
    });

    it("should recover after pairing failure by retrying", async () => {
      mockInitiatePairing.mockRejectedValueOnce(new Error("Connection refused"));

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await goThroughAcknowledgement(user);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to connect to Concordium ID App. Please try again."),
        ).toBeOnTheScreen();
      });

      // Retry with successful pairing
      const pairing = setupSuccessfulPairing();

      await user.press(screen.getByRole("button", { name: /retry/i }));

      pairing.resolveApproval();
      await waitFor(() => {
        expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeOnTheScreen();
      });
    });
  });

  describe("session expired during account creation", () => {
    it("should return to pairing step when session expires", async () => {
      const pairing = setupSuccessfulPairing();
      mockGetPublicKey.mockResolvedValue("aa".repeat(32));
      // Override: session gone when onboardAccount checks it
      mockGetSession.mockResolvedValue(null);

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToPairSuccess(user, pairing);

      // Stall re-pairing so we can observe the CONNECTING state on PAIR step
      const stalledPairing = createDeferred();
      mockInitiatePairing.mockImplementation(() => stalledPairing.promise);

      await user.press(screen.getByRole("button", { name: /continue/i }));

      // Session expired during onboard → bounces back to pairing step
      await waitFor(() => {
        expect(screen.getByText("Connect to Concordium ID App")).toBeOnTheScreen();
        expect(screen.getByText("Connecting...")).toBeOnTheScreen();
      });
    });

    it("should recover after session expiry by re-pairing and completing flow", async () => {
      const pairing = setupSuccessfulPairing();
      mockGetPublicKey.mockResolvedValue("aa".repeat(32));
      // Override: session gone when onboardAccount checks it
      mockGetSession.mockResolvedValue(null);

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToPairSuccess(user, pairing);
      await user.press(screen.getByRole("button", { name: /continue/i }));

      // Session expired → bounces back to pairing, re-pairing starts automatically
      await waitFor(() => {
        expect(screen.getByText("Connect to Concordium ID App")).toBeOnTheScreen();
      });

      // Restore session + set up account creation for second attempt
      const newPairing = setupSuccessfulPairing();
      const creation = setupSuccessfulAccountCreation();

      newPairing.resolveApproval();
      await waitFor(() => {
        expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeOnTheScreen();
      });

      await user.press(screen.getByRole("button", { name: /continue/i }));

      // Resolve account creation and signing for the second attempt
      creation.resolveAccountCreation();
      creation.resolveSigning();

      await waitFor(() => {
        expect(
          screen.getByText("Your Concordium account has been created successfully."),
        ).toBeOnTheScreen();
      });
    });
  });

  describe("IDApp response errors during account creation", () => {
    it("should show error when IDApp returns error response", async () => {
      const pairing = setupSuccessfulPairing();
      setupSuccessfulAccountCreation();
      mockRequestCreateAccount.mockResolvedValue({
        status: "error",
        message: { details: "Identity verification failed" },
      });

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToCreateStep(user, pairing);

      await waitFor(() => {
        expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
      });
      expect(screen.getByRole("button", { name: /retry/i })).toBeOnTheScreen();
    });

    it("should show error when IDApp response is missing serializedCredentialDeploymentTransaction", async () => {
      const pairing = setupSuccessfulPairing();
      setupSuccessfulAccountCreation();
      mockRequestCreateAccount.mockResolvedValue({
        status: "success",
        message: {
          identityIndex: 0,
          credNumber: 0,
          accountAddress: "some_address",
        },
      });

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToCreateStep(user, pairing);

      await waitFor(() => {
        expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
      });
      expect(screen.getByRole("button", { name: /retry/i })).toBeOnTheScreen();
    });

    it("should recover after IDApp error by retrying", async () => {
      const pairing = setupSuccessfulPairing();
      const creation = setupSuccessfulAccountCreation();
      // Override: first requestCreateAccount call returns error
      mockRequestCreateAccount.mockResolvedValueOnce({
        status: "error",
        message: { details: "Temporary failure" },
      });

      const { user } = render(<OnboardScreen />, { overrideInitialState });
      await advanceToCreateStep(user, pairing);

      await waitFor(() => {
        expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
      });

      // Prepare for retry: resolve deferreds so the second attempt succeeds
      creation.resolveAccountCreation();
      creation.resolveSigning();

      await user.press(screen.getByRole("button", { name: /retry/i }));

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
});
