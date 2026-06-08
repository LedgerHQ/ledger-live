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

// The flow starts in the LedgerSyncActivated (Manage) state, so opening the drawer mounts
// the Manage screen, whose `useLedgerSyncInfo` fires `GET /_info` to the real trustchain and
// cloud-sync staging backends. Mock it so the unit test stays offline.
jest.mock("../hooks/useLedgerSyncInfo", () => ({
  useLedgerSyncInfo: () => ({
    statusQuery: { error: null, isLoading: false, isError: false },
    trustchain: null,
    walletState: null,
  }),
}));

describe("Synchronize flow", () => {
  beforeEach(() => {
    // `doNotFake` keeps the microtask/immediate primitives real. Faking them (jest's default)
    // starves the async draining of in-flight `fetch` response bodies (undici + Node web
    // streams), so on Node 24 the byte-stream pull loop spins forever and leaks ~100MB/s until
    // the Jest worker OOMs.
    jest.useFakeTimers({ doNotFake: ["setImmediate", "queueMicrotask", "nextTick"] });
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
});
