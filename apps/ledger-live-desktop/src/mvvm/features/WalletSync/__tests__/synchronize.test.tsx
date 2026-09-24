import React from "react";
import { render, screen, act } from "tests/testSetup";
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

describe("Synchronize flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // React 19's act() uses queueMicrotask for scheduling — faking it causes act() to hang.
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

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
      userEventOptions: { advanceTimers: jest.advanceTimersByTime },
    });

    await user.click(screen.getByRole("button", { name: "Manage" }));

    await user.click(await screen.findByTestId("walletSync-synchronize"));

    await screen.findByText(/Sync with the Ledger Wallet app on another phone/i);

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

  const renderFlow = () =>
    render(<WalletSyncTestApp />, {
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
      userEventOptions: { advanceTimers: jest.advanceTimersByTime },
    });

  describe.each([
    ["before the pin code is displayed", false],
    ["after the pin code is displayed", true],
  ])("when the pairing protocol fails %s", (_, displayDigitsFirst) => {
    it("requests a new QR code", async () => {
      const rejects: ((error: unknown) => void)[] = [];
      const onDisplayDigitsCalls: ((digits: string) => void)[] = [];
      (createQRCodeHostInstance as jest.Mock).mockImplementation(({ onDisplayDigits }) => {
        onDisplayDigitsCalls.push(onDisplayDigits);
        return new Promise((_resolve, reject) => rejects.push(reject));
      });

      const { user } = renderFlow();

      await user.click(screen.getByRole("button", { name: "Manage" }));
      await user.click(await screen.findByTestId("walletSync-synchronize"));
      await screen.findByText(/Sync with the Ledger Wallet app on another phone/i);
      expect(createQRCodeHostInstance).toHaveBeenCalledTimes(1);

      if (displayDigitsFirst) {
        act(() => onDisplayDigitsCalls[0]("321"));
        await screen.findByTestId("pin-code-digit-0");
      }

      await act(async () => {
        rejects[0](Object.assign(new Error("boom"), { name: "QRCodeProtocolError" }));
      });

      expect(createQRCodeHostInstance).toHaveBeenCalledTimes(2);
      await screen.findByText(/Sync with the Ledger Wallet app on another phone/i);
    });
  });
});
