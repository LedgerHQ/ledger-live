import React from "react";
import { render, screen } from "@tests/test-renderer";

import { INITIAL_TEST, WalletSyncSettingsNavigator } from "./shared";

describe("scanQRCode", () => {
  it("Should open the QR code scene when 'scan qr code' toggle is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/I already turned it on/i));
    await user.press(await screen.findByText(/scan qr code/i));
    expect(screen.queryAllByText(/show qr/i)).toHaveLength(2);
    expect(screen.getByTestId("ws-scan-camera")).toBeVisible();
  });
});
