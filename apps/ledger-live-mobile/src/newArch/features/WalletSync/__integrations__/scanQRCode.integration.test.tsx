import React from "react";
import { render, screen } from "@tests/test-renderer";

import { INITIAL_TEST, WalletSyncSettingsNavigator } from "./shared";

describe("scanQRCode", () => {
  it("Should open the QR code scene when 'scan a qr code' toggle is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/already created a key?/i));
    await user.press(await screen.findByText(/scan a qr code/i));
    await expect(await screen.findByText(/show qr/i)).toBeVisible();
  });
});
