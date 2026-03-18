/* eslint-disable i18next/no-literal-string */
import React from "react";
import { Linking } from "react-native";
import { screen, render, waitFor, act } from "@tests/test-renderer";
import { Subject } from "rxjs";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { ConcordiumPairingStatus, AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import OnboardScreen from "../OnboardScreen";
import type { State } from "~/reducers/types";

let pairingSubject: Subject<unknown>;
let onboardSubject: Subject<unknown>;

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: () => ({
    pairWalletConnect: () => pairingSubject.asObservable(),
    onboardAccount: () => onboardSubject.asObservable(),
  }),
}));

jest.mock("@ledgerhq/coin-concordium/network/walletConnect", () => ({
  setWalletConnect: jest.fn(),
  getWalletConnect: () => ({ disconnectAllSessions: jest.fn() }),
  clearWalletConnect: jest.fn(),
}));

jest.mock("react-native-qrcode-svg", () => {
  const { View } = require("react-native");
  return function MockQRCode({ value }: { value: string }) {
    return <View testID={`qr-code-${value}`} />;
  };
});

const currency = getCryptoCurrencyById("concordium");
const creatableAccount = { ...genAccount("concordium-1", { currency }), used: false };
const completedAccount = { ...genAccount("concordium-completed", { currency }), used: true };

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

const overrideInitialState = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    lastConnectedDevice: {
      deviceId: "test-device-id",
      modelId: DeviceModelId.nanoX,
      wired: false,
    },
  },
});

describe("Concordium onboarding happy path", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pairingSubject = new Subject();
    onboardSubject = new Subject();
  });

  async function goThroughAcknowledgement(user: ReturnType<typeof render>["user"]) {
    expect(screen.getByText("Acknowledgement")).toBeOnTheScreen();
    expect(screen.getByText("Agree")).toBeOnTheScreen();
    expect(screen.getByText("Cancel")).toBeOnTheScreen();
    await user.press(screen.getByText("Agree"));
  }

  async function emitPairingReady(uri = "wc://test-pairing-uri") {
    expect(screen.getByText("Connect to Concordium ID App")).toBeOnTheScreen();
    expect(screen.getByText("Connecting...")).toBeOnTheScreen();
    await act(async () => {
      pairingSubject.next({
        status: ConcordiumPairingStatus.PREPARE,
        walletConnectUri: uri,
      });
    });
  }

  async function emitPairingSuccess(sessionTopic = "ABCD1234sessiontopic") {
    await act(async () => {
      pairingSubject.next({
        status: ConcordiumPairingStatus.SUCCESS,
        sessionTopic,
      });
    });
    await waitFor(() => {
      expect(
        screen.getByText("Successfully connected to Concordium ID App."),
      ).toBeOnTheScreen();
    });
  }

  async function goThroughAccountCreation(user: ReturnType<typeof render>["user"]) {
    await user.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(screen.getByText("Add Concordium Account")).toBeOnTheScreen();
    });

    // Confirmation code: first 4 chars of session topic uppercased
    expect(screen.getByText("A")).toBeOnTheScreen();
    expect(screen.getByText("B")).toBeOnTheScreen();
    expect(screen.getByText("C")).toBeOnTheScreen();
    expect(screen.getByText("D")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "To create an account, match the code below in the Concordium ID App",
      ),
    ).toBeOnTheScreen();

    // User approves on device — bridge reports signing progress
    await act(async () => {
      onboardSubject.next({ status: AccountOnboardStatus.SIGN });
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "Approve the transaction on your Ledger device. Keep your Ledger nearby.",
        ),
      ).toBeOnTheScreen();
    });

    // Bridge returns completed account
    await act(async () => {
      onboardSubject.next({ account: completedAccount });
    });

    await waitFor(() => {
      expect(
        screen.getByText("Your Concordium account has been created successfully."),
      ).toBeOnTheScreen();
    });

    await user.press(screen.getByText("Continue"));

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
    await emitPairingReady();

    // App is installed — deep link button shown instead of QR code
    await waitFor(() => {
      expect(screen.getByText("Open Concordium ID App")).toBeOnTheScreen();
    });
    expect(screen.queryByTestId("qr-code-wc://test-pairing-uri")).toBeNull();

    await user.press(screen.getByText("Open Concordium ID App"));
    expect(Linking.openURL).toHaveBeenCalledWith("wc://test-pairing-uri");

    // Concordium ID App received the deep link and approves pairing
    await emitPairingSuccess();
    await goThroughAccountCreation(user);
  });

  it("should complete onboarding via QR code when Concordium ID App is not installed", async () => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);

    const { user } = render(<OnboardScreen />, { overrideInitialState });

    await goThroughAcknowledgement(user);
    await emitPairingReady();

    // App not installed — QR code and store badge shown
    await waitFor(() => {
      expect(screen.getByTestId("qr-code-wc://test-pairing-uri")).toBeOnTheScreen();
    });
    expect(
      screen.getByText(
        "Scan the QR code with another device, or download the Concordium ID App to continue.",
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Open Concordium ID App")).toBeNull();

    // User scans QR with another device, Concordium ID App approves pairing
    await emitPairingSuccess();
    await goThroughAccountCreation(user);
  });
});
