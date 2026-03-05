import React from "react";
import { Linking } from "react-native";
import { render, screen, userEvent } from "@tests/test-renderer";
import StepPair from "../components/StepPair";
import { PairStatus } from "../hooks/usePairing";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

const mockStartPairing = jest.fn();
const mockUsePairing = jest.fn();
const mockUseIdAppDetection = jest.fn();

jest.mock("../hooks/usePairing", () => ({
  ...jest.requireActual("../hooks/usePairing"),
  usePairing: (...args: unknown[]) => mockUsePairing(...args),
}));

jest.mock("../hooks/useIdAppDetection", () => ({
  useIdAppDetection: () => mockUseIdAppDetection(),
}));

jest.mock("react-native-qrcode-svg", () => {
  const { View } = require("react-native");
  return function MockQRCode({ value }: { value: string }) {
    return <View testID={`qr-code-${value}`} />;
  };
});

const currency = getCryptoCurrencyById("concordium");
const onPaired = jest.fn();

const setupMocks = (
  pairingOverrides: { pairStatus: PairStatus; walletConnectUri?: string | null },
  detectionOverrides: { isInstalled: boolean | null },
) => {
  mockUsePairing.mockReturnValue({
    pairStatus: pairingOverrides.pairStatus,
    walletConnectUri: pairingOverrides.walletConnectUri ?? null,
    startPairing: mockStartPairing,
  });
  mockUseIdAppDetection.mockReturnValue({
    isInstalled: detectionOverrides.isInstalled,
    openIdApp: jest.fn((uri: string) => Linking.openURL(uri)),
    storeUrl: "https://apps.apple.com/us/app/concordium-id/id6746754485",
  });
};

describe("StepPair", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show connecting state", () => {
    setupMocks({ pairStatus: PairStatus.CONNECTING }, { isInstalled: null });
    render(<StepPair currency={currency} onPaired={onPaired} />);

    expect(screen.getByText("Connecting...")).toBeDefined();
  });

  it("should show loader when QR ready but app detection pending", () => {
    setupMocks(
      { pairStatus: PairStatus.QR_READY, walletConnectUri: "concordiumidapp://test" },
      { isInstalled: null },
    );
    render(<StepPair currency={currency} onPaired={onPaired} />);

    expect(screen.queryByText("Open Concordium ID App")).toBeNull();
    expect(screen.queryByTestId("qr-code-concordiumidapp://test")).toBeNull();
  });

  it("should show open button when app is installed", () => {
    setupMocks(
      { pairStatus: PairStatus.QR_READY, walletConnectUri: "concordiumidapp://test" },
      { isInstalled: true },
    );
    render(<StepPair currency={currency} onPaired={onPaired} />);

    expect(screen.getByText("Open Concordium ID App")).toBeDefined();
  });

  it("should show QR code and store badge when app is not installed", () => {
    setupMocks(
      { pairStatus: PairStatus.QR_READY, walletConnectUri: "concordiumidapp://test" },
      { isInstalled: false },
    );
    render(<StepPair currency={currency} onPaired={onPaired} />);

    expect(screen.getByTestId("qr-code-concordiumidapp://test")).toBeDefined();
    expect(
      screen.getByText(
        "Scan the QR code with another device, or download the Concordium ID App to continue.",
      ),
    ).toBeDefined();
  });

  it("should show success alert", () => {
    setupMocks({ pairStatus: PairStatus.SUCCESS }, { isInstalled: null });
    render(<StepPair currency={currency} onPaired={onPaired} />);

    expect(screen.getByText("Successfully paired with Concordium ID App.")).toBeDefined();
  });

  it("should show error alert with retry button", () => {
    setupMocks({ pairStatus: PairStatus.ERROR }, { isInstalled: null });
    render(<StepPair currency={currency} onPaired={onPaired} />);

    expect(screen.getByText("Failed to pair with Concordium ID App.")).toBeDefined();
    expect(screen.getByText("Retry")).toBeDefined();
  });

  it("should call startPairing on retry", async () => {
    setupMocks({ pairStatus: PairStatus.ERROR }, { isInstalled: null });
    render(<StepPair currency={currency} onPaired={onPaired} />);

    await userEvent.press(screen.getByText("Retry"));

    expect(mockStartPairing).toHaveBeenCalledTimes(1);
  });
});
