/* eslint-disable i18next/no-literal-string */
import React from "react";
import { Linking } from "react-native";
import { screen, render, waitFor } from "@tests/test-renderer";
import { server } from "@tests/server";
import { TransportStatusError, DisconnectedDeviceDuringOperation } from "@ledgerhq/errors";
import OnboardScreen from "../OnboardScreen";
import {
  SESSION_TOPIC,
  WC_RAW_URI,
  TEST_PUBLIC_KEY,
  TEST_SIGNATURE,
  TEST_SERIALIZED_CDT,
  currency,
  creatableAccount,
  createSession,
  overrideInitialState,
  concordiumHandlers,
} from "./testUtils";

// ── Mock WalletConnect class ──

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

function setupAccountCreationBase() {
  mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
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

describe("Concordium onboarding signature failures", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(...concordiumHandlers);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    setupSuccessfulPairing();
    setupAccountCreationBase();
  });

  async function advanceToCreateStep(user: ReturnType<typeof render>["user"]) {
    await user.press(screen.getByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeOnTheScreen();
    });

    await user.press(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText("Add Concordium Account")).toBeOnTheScreen();
      expect(screen.getByText(SESSION_TOPIC[0].toUpperCase())).toBeOnTheScreen();
    });
  }

  it("should show error when device returns empty signature", async () => {
    mockSignCredentialDeployment.mockResolvedValue("");

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToCreateStep(user);

    await waitFor(() => {
      expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
    });
    expect(screen.getByRole("button", { name: /retry/i })).toBeOnTheScreen();
  });

  it("should show error when user refuses signing on device", async () => {
    mockSignCredentialDeployment.mockRejectedValue(new TransportStatusError(0x6985));

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToCreateStep(user);

    await waitFor(() => {
      expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
    });
    expect(screen.getByRole("button", { name: /retry/i })).toBeOnTheScreen();
  });

  it("should show error when device disconnects during signing", async () => {
    mockSignCredentialDeployment.mockRejectedValue(new DisconnectedDeviceDuringOperation());

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToCreateStep(user);

    await waitFor(() => {
      expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
    });
    expect(screen.getByRole("button", { name: /retry/i })).toBeOnTheScreen();
  });

  it("should recover after signature failure by retrying", async () => {
    // First attempt: device refuses
    mockSignCredentialDeployment.mockRejectedValueOnce(new TransportStatusError(0x6985));

    const { user } = render(<OnboardScreen />, { overrideInitialState });
    await advanceToCreateStep(user);

    await waitFor(() => {
      expect(screen.getByText("Failed to create account. Please try again.")).toBeOnTheScreen();
    });

    // Set up success for retry
    mockSignCredentialDeployment.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(TEST_SIGNATURE), 100)),
    );

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
