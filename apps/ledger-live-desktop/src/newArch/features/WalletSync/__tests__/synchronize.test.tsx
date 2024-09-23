import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import { WalletSyncTestApp, simpleTrustChain, walletSyncActivatedState } from "./shared";

jest.mock("../hooks/useQRCode", () => ({
  useQRCode: () => ({
    startQRCodeProcessing: () => jest.fn(),
    url: "https://ledger.com",
    error: null,
    isLoading: false,
  }),
}));

jest.mock("../hooks/useGetMembers", () => ({
  useGetMembers: () => ({
    isLoading: false,
    data: [],
    isError: false,
    error: null,
  }),
}));

const openDrawer = async () => {
  const { user } = render(<WalletSyncTestApp />, {
    initialState: {
      walletSync: walletSyncActivatedState,
      trustchain: {
        trustchain: simpleTrustChain,
        memberCredentials: {
          pubkey: "pubkey",
          privatekey: "privatekey",
        },
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

    // QRCode Page
    await waitFor(() =>
      expect(screen.getByText(/Sync with the Ledger Live app on another phone/i)).toBeDefined(),
    );

    //PinCode Page after scanning QRCode
    // Need to wait 3 seconds to simulate the time taken to scan the QR code
    setTimeout(async () => {
      await waitFor(() => {
        screen.debug();
        expect(screen.getByText("Your Ledger Sync code")).toBeDefined();
      });
    }, 3000);

    //Succes Page after PinCode
    setTimeout(async () => {
      await waitFor(() => {
        screen.debug();
        expect(
          screen.getByText(
            "Changes in your crypto accounts will now automatically appear across Ledger Live apps on synched phones and computers.",
          ),
        ).toBeDefined();
      });
    }, 3000);
  });
});
