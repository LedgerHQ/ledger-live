import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";

import { INITIAL_TEST, WalletSyncSettingsNavigator } from "./shared";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

jest.mock("@ledgerhq/trustchain/qrcode/index", () => ({
  createQRCodeHostInstance: () => ({
    trustchainApiBaseUrl: getWalletSyncEnvironmentParams("STAGING").trustchainApiBaseUrl,
    onDisplayQRCode: jest.fn().mockImplementation(url => url),
    onDisplayDigits: jest.fn().mockImplementation(digits => digits),
    addMember: jest.fn(),
  }),
}));

describe("SynchronizeWithQrCode", () => {
  it("Should display the QR code when 'show qr' toggle is pressed and add a new member through the flow", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/already created a key?/i));
    await user.press(await screen.findByText(/scan a qr code/i));
    await user.press(await screen.findByText(/show qr/i));
    expect(await screen.getByTestId("ws-qr-code-displayed")).toBeVisible();

    //PinCode Page after scanning QRCode
    // Need to wait 3 seconds to simulate the time taken to scan the QR code
    setTimeout(async () => {
      await waitFor(() => {
        expect(screen.getByText("Enter the code")).toBeDefined();
      });
    }, 3000);

    //Succes Page after PinCode
    setTimeout(async () => {
      await waitFor(() => {
        expect(
          screen.getByText(
            "Changes in your accounts will now automatically appear across all apps and platforms.",
          ),
        ).toBeDefined();
      });
    }, 3000);
  });
});
