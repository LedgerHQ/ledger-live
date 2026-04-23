/* eslint-disable i18next/no-literal-string */
import React from "react";
import { Linking } from "react-native";
import { screen, render, waitFor } from "@tests/test-renderer";
import { server } from "@tests/server";
import OnboardScreen from "../OnboardScreen";
import {
  SESSION_TOPIC,
  WC_FORMATTED_URI,
  overrideInitialState,
  concordiumHandlers,
} from "./testUtils";
import {
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

describe("Concordium onboarding happy path", () => {
  let pairing: ReturnType<typeof setupSuccessfulPairing>;
  let creation: ReturnType<typeof setupSuccessfulAccountCreation>;

  beforeEach(() => {
    jest.clearAllMocks();
    server.use(...concordiumHandlers);
    pairing = setupSuccessfulPairing();
    creation = setupSuccessfulAccountCreation();
  });

  async function goThroughAcknowledgement(user: ReturnType<typeof render>["user"]) {
    expect(screen.getByText("Acknowledgement")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /agree/i })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /agree/i }));
  }

  async function waitForPairingSuccess() {
    pairing.resolveApproval();
    await waitFor(() => {
      expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeOnTheScreen();
    });
  }

  async function goThroughAccountCreation(user: ReturnType<typeof render>["user"]) {
    await user.press(screen.getByRole("button", { name: /continue/i }));

    // Confirmation code visible while waiting for IDApp response
    await waitFor(() => {
      expect(screen.getByText("Add Concordium Account")).toBeOnTheScreen();
      expect(screen.getByText(SESSION_TOPIC[0].toUpperCase())).toBeOnTheScreen();
    });
    expect(screen.getByText(SESSION_TOPIC[1].toUpperCase())).toBeOnTheScreen();
    expect(screen.getByText(SESSION_TOPIC[2].toUpperCase())).toBeOnTheScreen();
    expect(screen.getByText(SESSION_TOPIC[3].toUpperCase())).toBeOnTheScreen();
    expect(
      screen.getByText("To create an account, match the code below in the Concordium ID App"),
    ).toBeOnTheScreen();

    // IDApp responds with credential data
    creation.resolveAccountCreation();

    // Device signing
    await waitFor(() => {
      expect(
        screen.getByText("Approve the transaction on your Ledger device. Keep your Ledger nearby."),
      ).toBeOnTheScreen();
    });

    // Device signs the transaction
    creation.resolveSigning();

    // Success
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
        params: expect.objectContaining({
          currency: expect.objectContaining({ id: "concordium" }),
        }),
      }),
    );
  }

  it("should complete onboarding via deep link when Concordium ID App is installed", async () => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<OnboardScreen />, { overrideInitialState });

    await goThroughAcknowledgement(user);

    // App is installed — deep link button shown instead of QR code
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /open concordium id app/i })).toBeOnTheScreen();
    });

    await user.press(screen.getByRole("button", { name: /open concordium id app/i }));
    expect(Linking.openURL).toHaveBeenCalledWith(WC_FORMATTED_URI);

    await waitForPairingSuccess();
    await goThroughAccountCreation(user);
  });

  it("should complete onboarding via QR code when Concordium ID App is not installed", async () => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);

    const { user } = render(<OnboardScreen />, { overrideInitialState });

    await goThroughAcknowledgement(user);

    // App not installed — QR code shown
    await waitFor(() => {
      expect(screen.getByTestId(`qr-code-${WC_FORMATTED_URI}`)).toBeOnTheScreen();
    });
    expect(
      screen.getByText(
        "Scan the QR code with another device, or download the Concordium ID App to continue.",
      ),
    ).toBeOnTheScreen();

    await waitForPairingSuccess();
    await goThroughAccountCreation(user);
  });
});
