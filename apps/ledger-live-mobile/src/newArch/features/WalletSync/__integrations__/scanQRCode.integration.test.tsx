import React from "react";
import { render, screen, act, fireEvent } from "@tests/test-renderer";

import { INITIAL_TEST, WalletSyncSettingsNavigator } from "./shared";

describe("scanQRCode", () => {
  it("Should open the QR code scene when 'scan qr code' toggle is pressed", async () => {
    render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });

    // This is a workaround to avoid the press event being ignored using onPressIn
    await act(async () => {
      await fireEvent.press(await screen.findByText(/ledger sync/i));
      await fireEvent.press(await screen.findByText(/I already turned it on/i));
      await fireEvent.press(await screen.findByText(/scan qr code/i));
    });
    expect(screen.queryAllByText(/show qr/i)).toHaveLength(2);
    expect(screen.getByTestId("ws-scan-camera")).toBeVisible();
  });
});
