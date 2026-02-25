import { broadcast } from "./broadcast";
import wallet, { getWalletAccount } from "./wallet-btc";
import { Account, SignedOperation } from "@ledgerhq/types-live";

jest.mock("./wallet-btc");

describe("broadcast", () => {
  const mockAccount = {
    id: "mock-account-id",
    currency: { family: "bitcoin" },
    bitcoinResources: {
      utxos: [],
    },
  } as unknown as Account;

  const mockWalletAccount = {
    xpub: {
      crypto: "bitcoin",
      xpub: "mock-xpub",
    },
  };

  const mockSignedOperation: SignedOperation = {
    operation: {
      id: "mock-operation-id",
      hash: "",
      type: "OUT",
      value: "1000000",
      fee: "1000",
      blockHash: null,
      blockHeight: null,
      senders: ["sender-address"],
      recipients: ["recipient-address"],
      accountId: "mock-account-id",
      date: new Date(),
      extra: {},
    },
    signature: "mock-signature",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getWalletAccount as jest.Mock).mockReturnValue(mockWalletAccount);
  });

  it("should broadcast transaction without broadcastConfig", async () => {
    const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-tx-hash");

    await broadcast({
      account: mockAccount,
      signedOperation: mockSignedOperation,
    });

    expect(mockBroadcastTx).toHaveBeenCalledWith(expect.any(Object), "mock-signature", undefined);
  });

  it("should broadcast transaction with broadcastConfig containing source", async () => {
    const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-tx-hash");

    await broadcast({
      account: mockAccount,
      signedOperation: mockSignedOperation,
      broadcastConfig: {
        mevProtected: false,
        source: { type: "live-app", name: "test-manifest" },
      },
    });

    expect(mockBroadcastTx).toHaveBeenCalledWith(expect.any(Object), "mock-signature", {
      mevProtected: false,
      source: { type: "live-app", name: "test-manifest" },
    });
  });

  it("should return operation with hash", async () => {
    jest.spyOn(wallet, "broadcastTx").mockResolvedValue("broadcasted-hash");

    const result = await broadcast({
      account: mockAccount,
      signedOperation: mockSignedOperation,
      broadcastConfig: {
        mevProtected: false,
        source: { type: "swap", name: "provider-name" },
      },
    });

    expect(result.hash).toBe("broadcasted-hash");
    expect(result.id).toContain("broadcasted-hash");
  });

  it("should support all source types", async () => {
    const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");

    const sourceTypes: Array<"live-app" | "dApp" | "coin-module" | "swap"> = [
      "live-app",
      "dApp",
      "coin-module",
      "swap",
    ];

    for (const type of sourceTypes) {
      await broadcast({
        account: mockAccount,
        signedOperation: mockSignedOperation,
        broadcastConfig: {
          mevProtected: false,
          source: { type, name: `test-${type}` },
        },
      });

      expect(mockBroadcastTx).toHaveBeenCalledWith(expect.any(Object), "mock-signature", {
        mevProtected: false,
        source: { type, name: `test-${type}` },
      });

      mockBroadcastTx.mockClear();
    }
  });
});
