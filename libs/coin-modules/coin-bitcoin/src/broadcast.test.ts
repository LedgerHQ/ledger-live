import BigNumber from "bignumber.js";
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { broadcast } from "./broadcast";
import wallet, { getWalletAccount } from "./wallet-btc";
import { registerChainAdapter } from "./chain-adapters/registry";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";

jest.mock("./wallet-btc");

describe("broadcast", () => {
  const mockAccount = {
    id: "mock-account-id",
    currency: { family: "bitcoin" },
    bitcoinResources: {
      utxos: [],
    },
  } as unknown as Account;

  const mockExplorer = {
    fetchUtxoTx: jest.fn(),
  };

  const mockWalletAccount = {
    xpub: {
      crypto: "bitcoin",
      xpub: "mock-xpub",
      explorer: mockExplorer,
    },
  };

  const mockSignedOperation: SignedOperation = {
    operation: {
      id: "mock-operation-id",
      hash: "",
      type: "OUT",
      value: new BigNumber("1000000"),
      fee: new BigNumber("1000"),
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

  const makeTxOutput = (output_index: number, spent_at_height: number | null) => ({
    output_index,
    value: "1000000",
    address: "some-address",
    spent_at_height,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getWalletAccount as jest.Mock).mockReturnValue(mockWalletAccount);
    mockExplorer.fetchUtxoTx.mockResolvedValue({ outputs: [] });
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

  describe("chain-adapter broadcast delegation", () => {
    const adapterCurrencyId = "dummy-chain-adapter-currency-test";
    const adapterAccount = {
      ...mockAccount,
      currency: { id: adapterCurrencyId },
    } as unknown as Account;

    it("returns the adapter result and does not call the explorer broadcast when an adapter owns broadcasting", async () => {
      const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("explorer-hash");
      const adapterOperation = {
        ...mockSignedOperation.operation,
        hash: "adapter-hash",
        id: "adapter-op-id",
      } as Operation;
      const adapterBroadcast = jest.fn().mockResolvedValue(adapterOperation);

      registerChainAdapter({ id: adapterCurrencyId, broadcast: adapterBroadcast });

      const result = await broadcast({
        account: adapterAccount,
        signedOperation: mockSignedOperation,
      });

      expect(adapterBroadcast).toHaveBeenCalledWith(adapterAccount, mockSignedOperation);
      expect(result).toBe(adapterOperation);
      expect(mockBroadcastTx).not.toHaveBeenCalled();
    });

    it("falls through to the explorer broadcast when the adapter broadcast returns undefined", async () => {
      const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("explorer-hash");
      const adapterBroadcast = jest.fn().mockReturnValue(undefined);

      registerChainAdapter({ id: adapterCurrencyId, broadcast: adapterBroadcast });

      const result = await broadcast({
        account: adapterAccount,
        signedOperation: mockSignedOperation,
      });

      expect(adapterBroadcast).toHaveBeenCalledWith(adapterAccount, mockSignedOperation);
      expect(mockBroadcastTx).toHaveBeenCalledWith(expect.any(Object), "mock-signature", undefined);
      expect(result.hash).toBe("explorer-hash");
    });

    // Ordering guarantee: the double-spend guard is deliberately placed BEFORE the
    // adapter delegation, so a Zcash Public→* flow (which carries transparent
    // inputRefs but broadcasts over gRPC via the adapter) is still protected. This
    // exercises the guard + delegation together — the two are otherwise tested only
    // in isolation.
    it("rejects via the double-spend guard BEFORE delegating to an adapter that owns broadcasting", async () => {
      const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("explorer-hash");
      const adapterBroadcast = jest.fn().mockResolvedValue({
        ...mockSignedOperation.operation,
        hash: "adapter-hash",
      } as Operation);

      registerChainAdapter({ id: adapterCurrencyId, broadcast: adapterBroadcast });

      // The referenced UTXO is already confirmed-spent (spent_at_height > 0).
      mockExplorer.fetchUtxoTx.mockResolvedValue({ outputs: [makeTxOutput(0, 949619)] });

      const signedOp: SignedOperation = {
        ...mockSignedOperation,
        operation: {
          ...mockSignedOperation.operation,
          extra: { inputRefs: [{ hash: "tx-hash", outputIndex: 0, address: "addr-a" }] },
        },
      };

      await expect(
        broadcast({ account: adapterAccount, signedOperation: signedOp }),
      ).rejects.toMatchObject({ name: "InvalidTransactionError", message: "utxos already spent" });

      // Guard short-circuits before either broadcast path runs.
      expect(adapterBroadcast).not.toHaveBeenCalled();
      expect(mockBroadcastTx).not.toHaveBeenCalled();
    });
  });

  describe("UTXO spent detection", () => {
    describe("skipping the check", () => {
      it("should skip check entirely when extra.inputRefs is absent", async () => {
        jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");

        await broadcast({ account: mockAccount, signedOperation: mockSignedOperation });

        expect(mockExplorer.fetchUtxoTx).not.toHaveBeenCalled();
      });

      it("should skip check when extra.inputRefs is an empty array", async () => {
        jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: { ...mockSignedOperation.operation, extra: { inputRefs: [] } },
        };

        await broadcast({ account: mockAccount, signedOperation: signedOp });

        expect(mockExplorer.fetchUtxoTx).not.toHaveBeenCalled();
      });

      it("should throw InvalidTransactionError and not broadcast when fetchUtxoTx rejects (explorer error)", async () => {
        const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");
        mockExplorer.fetchUtxoTx.mockRejectedValue(new Error("network error"));

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: { inputRefs: [{ hash: "tx-hash", outputIndex: 0, address: "addr-a" }] },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).rejects.toMatchObject({
          name: "InvalidTransactionError",
          message: "tx not found",
        });
        expect(mockBroadcastTx).not.toHaveBeenCalled();
      });
    });

    describe("spent_at_height is set (UTXO already confirmed-spent)", () => {
      it("should throw InvalidTransactionError and not call broadcastTx", async () => {
        const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, 949619)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: { inputRefs: [{ hash: "tx-hash", outputIndex: 0, address: "addr-a" }] },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).rejects.toMatchObject({
          name: "InvalidTransactionError",
          message: "utxos already spent",
        });
        expect(mockBroadcastTx).not.toHaveBeenCalled();
      });
    });

    describe("spent_at_height is not set (UTXO still available)", () => {
      it("should not throw when spent_at_height is null", async () => {
        jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, null)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: { inputRefs: [{ hash: "tx-hash", outputIndex: 0, address: "addr-a" }] },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).resolves.toBeDefined();
      });

      it("should not throw when spent_at_height is 0", async () => {
        jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, 0)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: { inputRefs: [{ hash: "tx-hash", outputIndex: 0, address: "addr-a" }] },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).resolves.toBeDefined();
      });

      it("should not throw when the outputIndex is not found in tx outputs", async () => {
        jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");
        // tx has output at index 1, we're looking for index 0
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(1, 949619)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: { inputRefs: [{ hash: "tx-hash", outputIndex: 0, address: "addr-a" }] },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).resolves.toBeDefined();
      });
    });

    describe("multiple outputs in the same source tx (same hash, different outputIndex)", () => {
      it("should not throw when all outputs are unspent", async () => {
        jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, null), makeTxOutput(1, null)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: {
              inputRefs: [
                { hash: "tx-hash", outputIndex: 0, address: "addr-a" },
                { hash: "tx-hash", outputIndex: 1, address: "addr-a" },
              ],
            },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).resolves.toBeDefined();
      });

      it("should throw when the first output is spent", async () => {
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, 949619), makeTxOutput(1, null)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: {
              inputRefs: [
                { hash: "tx-hash", outputIndex: 0, address: "addr-a" },
                { hash: "tx-hash", outputIndex: 1, address: "addr-a" },
              ],
            },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).rejects.toThrow(InvalidTransactionError);
      });

      it("should throw when the second output is spent", async () => {
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, null), makeTxOutput(1, 949619)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: {
              inputRefs: [
                { hash: "tx-hash", outputIndex: 0, address: "addr-a" },
                { hash: "tx-hash", outputIndex: 1, address: "addr-a" },
              ],
            },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).rejects.toThrow(InvalidTransactionError);
      });

      it("should throw when both outputs are spent", async () => {
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, 949619), makeTxOutput(1, 950000)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: {
              inputRefs: [
                { hash: "tx-hash", outputIndex: 0, address: "addr-a" },
                { hash: "tx-hash", outputIndex: 1, address: "addr-a" },
              ],
            },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).rejects.toThrow(InvalidTransactionError);
      });
    });

    describe("multiple inputs from different source txs", () => {
      it("should not throw when all source txs have unspent outputs", async () => {
        jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");
        mockExplorer.fetchUtxoTx
          .mockResolvedValueOnce({ outputs: [makeTxOutput(0, null)] })
          .mockResolvedValueOnce({ outputs: [makeTxOutput(0, null)] });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: {
              inputRefs: [
                { hash: "tx-hash-a", outputIndex: 0, address: "addr-a" },
                { hash: "tx-hash-b", outputIndex: 0, address: "addr-b" },
              ],
            },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).resolves.toBeDefined();
      });

      it("should throw when the second source tx has a spent output", async () => {
        mockExplorer.fetchUtxoTx
          .mockResolvedValueOnce({ outputs: [makeTxOutput(0, null)] })
          .mockResolvedValueOnce({ outputs: [makeTxOutput(0, 949619)] });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: {
              inputRefs: [
                { hash: "tx-hash-a", outputIndex: 0, address: "addr-a" },
                { hash: "tx-hash-b", outputIndex: 0, address: "addr-b" },
              ],
            },
          },
        };

        await expect(
          broadcast({ account: mockAccount, signedOperation: signedOp }),
        ).rejects.toThrow(InvalidTransactionError);
      });
    });

    describe("API call counts", () => {
      it("should call fetchUtxoTx once per unique hash, not per input", async () => {
        jest.spyOn(wallet, "broadcastTx").mockResolvedValue("mock-hash");
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, null), makeTxOutput(1, null)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: {
              inputRefs: [
                { hash: "tx-hash-a", outputIndex: 0, address: "addr-a" },
                { hash: "tx-hash-a", outputIndex: 1, address: "addr-a" }, // same tx hash
                { hash: "tx-hash-b", outputIndex: 0, address: "addr-b" },
              ],
            },
          },
        };

        await broadcast({ account: mockAccount, signedOperation: signedOp });

        expect(mockExplorer.fetchUtxoTx).toHaveBeenCalledTimes(2);
        expect(mockExplorer.fetchUtxoTx.mock.calls.map(([hash]: [string]) => hash)).toEqual(
          expect.arrayContaining(["tx-hash-a", "tx-hash-b"]),
        );
      });

      it("should call broadcastTx after a successful check", async () => {
        const mockBroadcastTx = jest.spyOn(wallet, "broadcastTx").mockResolvedValue("final-hash");
        mockExplorer.fetchUtxoTx.mockResolvedValue({
          outputs: [makeTxOutput(0, null)],
        });

        const signedOp: SignedOperation = {
          ...mockSignedOperation,
          operation: {
            ...mockSignedOperation.operation,
            extra: { inputRefs: [{ hash: "our-hash", outputIndex: 0, address: "addr-a" }] },
          },
        };

        await broadcast({ account: mockAccount, signedOperation: signedOp });

        expect(mockBroadcastTx).toHaveBeenCalledTimes(1);
      });
    });
  });
});
