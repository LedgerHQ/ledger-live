import React from "react";
import { render, screen, act } from "@tests/test-renderer";
import { INITIAL_TEST, WalletSyncSettingsNavigator } from "./shared";
import { createQRCodeCandidateInstance } from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import { BarcodeScanningResult } from "expo-camera";

const MOCK_BARCODE: BarcodeScanningResult = {
  cornerPoints: [],
  bounds: {
    origin: {
      x: 0,
      y: 0,
    },
    size: {
      height: 0,
      width: 0,
    },
  },
  type: "",
  data: "",
};

const mockSimulateBarcodeScanned = jest.fn();
jest.mock("expo-camera", () => ({
  CameraView: jest.fn(({ onBarcodeScanned }) => {
    mockSimulateBarcodeScanned.mockImplementation(onBarcodeScanned);
    return null;
  }),
}));

jest.mock("@ledgerhq/ledger-key-ring-protocol/qrcode/index", () => ({
  createQRCodeCandidateInstance: jest.fn(),
}));

jest.useFakeTimers();

describe("SynchronizeWithQrCode", () => {
  it("Should display the QR code when 'show qr' toggle is pressed and add a new member through the flow", async () => {
    let resolveQRCodeFlowPromise: unknown = null;
    let requestQRCodeInput: unknown = null;
    let pinCodeSet = false;
    const mockPromiseQRCodeCandidate = new Promise(resolve => {
      resolveQRCodeFlowPromise = resolve;
    });
    (createQRCodeCandidateInstance as jest.Mock).mockImplementation(({ onRequestQRCodeInput }) => {
      requestQRCodeInput = onRequestQRCodeInput;
      return mockPromiseQRCodeCandidate;
    });

    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/I already turned it on/i));
    await user.press(await screen.findByText(/scan qr code/i));
    await user.press(screen.queryAllByText(/show qr/i)[0]);
    expect(screen.getByTestId("ws-qr-code-displayed")).toBeVisible();

    await act(() => {
      mockSimulateBarcodeScanned(MOCK_BARCODE);
    });

    // Call programmatically the requestQRCodeInput function to display the pin code input
    await act(() => {
      if (typeof requestQRCodeInput === "function") {
        requestQRCodeInput({ digits: 3 }, (code: string) => {
          if (code === "123") {
            pinCodeSet = true;
          }
        });
      }
    });

    expect(await screen.findByText("Enter Ledger Sync code")).toBeDefined();
    const inputs = screen.getAllByDisplayValue("");
    await user.type(inputs[0], "1");
    await user.type(inputs[1], "2");
    await user.type(inputs[2], "3");

    // Resolve the QR code flow promise only if pin code is set
    if (pinCodeSet) {
      if (typeof resolveQRCodeFlowPromise === "function") {
        resolveQRCodeFlowPromise({ member: { name: "test" } });
      }
    }

    expect(await screen.findByText("We are updating the synched instances...")).toBeDefined();
    //Simulate the sync process
    await act(() => {
      jest.advanceTimersByTime(3 * 1000);
    });
    expect(await screen.findByText("Sync successful")).toBeDefined();
  });
});
