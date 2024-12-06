import React from "react";
import { render, screen, act } from "tests/testUtils";
import { createQRCodeHostInstance } from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import { WalletSyncTestApp, simpleTrustChain, walletSyncActivatedState } from "./shared";

jest.mock("../hooks/useGetMembers", () => ({
  useGetMembers: () => ({
    isLoading: false,
    data: [],
    isError: false,
    error: null,
  }),
}));

jest.mock("@ledgerhq/ledger-key-ring-protocol/qrcode/index", () => ({
  createQRCodeHostInstance: jest.fn(),
}));

jest.useFakeTimers({ advanceTimers: true });

describe("Synchronize flow", () => {
  it("should open drawer and should do Synchronize flow with QRCode", async () => {
    let resolveQRCodeFlowPromise: unknown = null;
    let requestDisplayDigits: unknown = null;
    const mockPromiseQRCodeCandidate = new Promise(resolve => {
      resolveQRCodeFlowPromise = resolve;
    });
    (createQRCodeHostInstance as jest.Mock).mockImplementation(({ onDisplayDigits }) => {
      requestDisplayDigits = onDisplayDigits;
      return mockPromiseQRCodeCandidate;
    });

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

    await user.click(screen.getByRole("button", { name: "Manage" }));

    await user.click(await screen.findByTestId("walletSync-synchronize"));

    await screen.findByText(/sync with the ledger live app on another phone/i);

    act(() => {
      if (typeof requestDisplayDigits === "function") requestDisplayDigits("321");
    });

    expect(await screen.findByTestId(/pin-code-digit-0/i)).toHaveTextContent("3");
    expect(await screen.findByTestId(/pin-code-digit-1/i)).toHaveTextContent("2");
    expect(await screen.findByTestId(/pin-code-digit-2/i)).toHaveTextContent("1");

    if (typeof resolveQRCodeFlowPromise === "function") resolveQRCodeFlowPromise();

    expect(await screen.findByText(/Hang tight.../i)).toBeDefined();

    await act(async () => {
      jest.advanceTimersByTime(3 * 1000);
    });

    expect(await screen.findByText(/sync successful!/i)).toBeDefined();
  });
});
