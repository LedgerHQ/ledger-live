/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import WalletSyncRow from "~/renderer/screens/settings/sections/General/WalletSync";
import { initialStateWalletSync } from "~/renderer/reducers/walletSync";

const WalletSyncTestApp = () => (
  <>
    <div id="modals"></div>
    <WalletSyncRow />
  </>
);

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

const openDrawer = async () => {
  const { user } = render(<WalletSyncTestApp />, {
    initialState: {
      walletSync: {
        ...initialStateWalletSync,
        activated: true,
      },
    },
  });
  const button = screen.getByRole("button", { name: "Manage" });

  return {
    button,
    user,
  };
};

describe("Synchronize flow", () => {
  it("should open drawer and should do Synchronize flow with QRCode", async () => {
    const { button, user } = await openDrawer();
    await user.click(button);

    const row = screen.getByTestId("walletSync-synchronize");
    await waitFor(() => expect(row).toBeDefined());

    await user.click(row);

    // Select Sync with QRCode
    await waitFor(() => expect(screen.getByTestId("walletSync-synchronize-scan")).toBeDefined());
    const qrCodeCard = screen.getByTestId("walletSync-synchronize-scan");
    await user.click(qrCodeCard);

    // QRCode Page
    await waitFor(() =>
      expect(
        screen.getByText(/Scan and synchronize your accounts with another Ledger Live app/i),
      ).toBeDefined(),
    );

    //PinCode Page after scanning QRCode
    // Need to wait 3 seconds to simulate the time taken to scan the QR code
    setTimeout(async () => {
      await waitFor(() => expect(screen.getByText("Enter the code")).toBeDefined());
    }, 3000);
  });
});
