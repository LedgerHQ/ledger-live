/* eslint-disable i18next/no-literal-string */
import React from "react";
import { Linking } from "react-native";
import { screen, render, waitFor } from "@tests/test-renderer";
import { server } from "@tests/server";
import OnboardScreen from "../OnboardScreen";
import {
  SESSION_TOPIC,
  WC_RAW_URI,
  WC_FORMATTED_URI,
  TEST_PUBLIC_KEY,
  TEST_SIGNATURE,
  TEST_SERIALIZED_CDT,
  currency,
  creatableAccount,
  createSession,
  overrideInitialState,
  concordiumHandlers,
} from "./testUtils";

// ── Mock WalletConnect class (dynamic import of SignClient can't be intercepted) ──

const mockInitiatePairing = jest.fn();
const mockGetSession = jest.fn();
const mockRequestCreateAccount = jest.fn();
const mockDisconnectAllSessions = jest.fn();

jest.mock("@ledgerhq/coin-concordium/network/walletConnect", () => {
  let mockWalletConnect: unknown = null;

  class MockConcordiumWalletConnect {
    initiatePairing = (...args: unknown[]) => mockInitiatePairing(...args);
    getSession = (...args: unknown[]) => mockGetSession(...args);
    requestCreateAccount = (...args: unknown[]) => mockRequestCreateAccount(...args);
    disconnectAllSessions = () => mockDisconnectAllSessions();
  }

  return {
    __esModule: true,
    ConcordiumWalletConnect: MockConcordiumWalletConnect,
    setWalletConnect: () => {
      mockWalletConnect = mockWalletConnect || new MockConcordiumWalletConnect();
      return mockWalletConnect;
    },
    getWalletConnect: () => mockWalletConnect,
    clearWalletConnect: () => {
      mockWalletConnect = null;
    },
  };
});

// ── Mock device signer ──

const mockGetPublicKey = jest.fn();
const mockSignCredentialDeployment = jest.fn();

jest.mock("@ledgerhq/coin-concordium/signer", () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
  getPublicKey: (...args: unknown[]) => mockGetPublicKey(...args),
  signCredentialDeployment: (...args: unknown[]) => mockSignCredentialDeployment(...args),
}));

// ── Use real bridge with mocked dependencies ──

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const { createBridges } = jest.requireActual("@ledgerhq/coin-concordium/bridge/index");
  const coinConfig = () => ({
    status: { type: "active" },
    networkType: "mainnet",
    grpcUrl: "https://ccd-node-mainnet.coin.ledger.com",
    grpcPort: 443,
    proxyUrl: "https://ccd-wallet-proxy-mainnet.coin.ledger.com",
    minReserve: 0,
  });
  const { currencyBridge } = createBridges(jest.fn(), coinConfig);
  return { getCurrencyBridge: () => currencyBridge };
});

// ── Mock native QR code component ──

jest.mock("react-native-qrcode-svg", () => {
  const { View } = require("react-native");
  return function MockQRCode({ value }: { value: string }) {
    return <View testID={`qr-code-${value}`} />;
  };
});

// ── Mock navigation ──

const mockParentNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    goBack: jest.fn(),
    getParent: () => ({
      goBack: jest.fn(),
      navigate: mockParentNavigate,
    }),
  }),
  useRoute: () => ({
    params: {
      currency,
      accountsToAdd: [creatableAccount],
    },
  }),
}));

// ── Setup helpers ──

function setupSuccessfulPairing() {
  const session = createSession();

  mockInitiatePairing.mockResolvedValue({
    uri: WC_RAW_URI,
    approval: jest.fn(() => new Promise(resolve => setTimeout(() => resolve(session), 100))),
  });
  mockGetSession.mockResolvedValue(session);
}

function setupSuccessfulAccountCreation() {
  mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
  mockSignCredentialDeployment.mockImplementation(
    () => new Promise(resolve => setTimeout(() => resolve(TEST_SIGNATURE), 100)),
  );
  // Delay so PREPARING state (with confirmation code) is visible before SIGN is emitted
  mockRequestCreateAccount.mockImplementation(
    () =>
      new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              status: "success",
              message: {
                serializedCredentialDeploymentTransaction: TEST_SERIALIZED_CDT,
                identityIndex: 0,
                credNumber: 0,
                accountAddress: "completed_address",
              },
            }),
          100,
        ),
      ),
  );
}

// ── Test ──

describe("Concordium onboarding happy path", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(...concordiumHandlers);
    setupSuccessfulPairing();
    setupSuccessfulAccountCreation();
  });

  async function goThroughAcknowledgement(user: ReturnType<typeof render>["user"]) {
    expect(screen.getByText("Acknowledgement")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /agree/i })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /agree/i }));
  }

  async function waitForPairingSuccess() {
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

    // Device signing
    await waitFor(() => {
      expect(
        screen.getByText("Approve the transaction on your Ledger device. Keep your Ledger nearby."),
      ).toBeOnTheScreen();
    });

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
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);

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
