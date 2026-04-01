/* eslint-disable i18next/no-literal-string */
import React from "react";
import { Linking } from "react-native";
import { screen, render, waitFor } from "@tests/test-renderer";
import { server } from "@tests/server";
import { TransportStatusError, DisconnectedDeviceDuringOperation } from "@ledgerhq/errors";
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

// ── Setup helpers ──

const ID_APP_SUCCESS_RESPONSE = {
  status: "success" as const,
  message: {
    serializedCredentialDeploymentTransaction: TEST_SERIALIZED_CDT,
    identityIndex: 0,
    credNumber: 0,
    accountAddress: "completed_address",
  },
};

function setupAccountCreationBase() {
  const accountCreation = createDeferred<typeof ID_APP_SUCCESS_RESPONSE>();
  mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
  mockRequestCreateAccount.mockImplementation(() => accountCreation.promise);
  return { resolveAccountCreation: () => accountCreation.resolve(ID_APP_SUCCESS_RESPONSE) };
}

// ── Test ──

describe("Concordium onboarding signature failures", () => {
  let pairing: ReturnType<typeof setupSuccessfulPairing>;
  let accountCreation: ReturnType<typeof setupAccountCreationBase>;

  beforeEach(() => {
    jest.clearAllMocks();
    server.use(...concordiumHandlers);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    pairing = setupSuccessfulPairing();
    accountCreation = setupAccountCreationBase();
  });

  async function advanceToCreateStep(user: ReturnType<typeof render>["user"]) {
    await user.press(screen.getByRole("button", { name: /agree/i }));

    pairing.resolveApproval();
    await waitFor(() => {
      expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeOnTheScreen();
    });

    await user.press(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText("Add Concordium Account")).toBeOnTheScreen();
      expect(screen.getByText(SESSION_TOPIC[0].toUpperCase())).toBeOnTheScreen();
    });

    // IDApp responds — signing phase begins
    accountCreation.resolveAccountCreation();
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

    // Set up success for retry — accountCreation deferred is already resolved,
    // so the retry's requestCreateAccount call resolves immediately
    mockSignCredentialDeployment.mockResolvedValue(TEST_SIGNATURE);

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
