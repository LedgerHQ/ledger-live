import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { AlgorandCoinConfig } from "../config";
import * as logic from "../logic";
import { createApi } from "./index";

jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftApiTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn(),
  getBlockInfo: jest.fn(),
  lastBlock: jest.fn(),
  listOperations: jest.fn(),
  validateIntent: jest.fn(),
}));

const mockConfig: AlgorandCoinConfig = {
  node: "https://testnet-api.algonode.cloud/v2",
  indexer: "https://testnet-idx.algonode.cloud/v2",
  status: { type: "active" },
};

const mockCtx: Context<AlgorandCoinConfig> = {
  config: async () => mockConfig,
  logger: () => {},
};

describe("Algorand API", () => {
  let api: ReturnType<typeof createApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = createApi();
  });

  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(createApi(), mockCtx)).resolves.toEqual({
      unsupported: [
        "call",
        "craftRawTransaction",
        "getBlock",
        "getNextSequence",
        "getRewards",
        "getStakes",
        "getValidators",
        "register",
      ],
      inconsistent: [],
    });
  });
  describe("createApi", () => {
    it("declares every method the chain supports", () => {
      expect(api).toEqual({
        broadcast: expect.any(Function),
        combine: expect.any(Function),
        craftTransaction: expect.any(Function),
        estimateFees: expect.any(Function),
        getBalance: expect.any(Function),
        getBlockInfo: expect.any(Function),
        lastBlock: expect.any(Function),
        listOperations: expect.any(Function),
        validateAddress: expect.any(Function),
        validateIntent: expect.any(Function),
        craftTransactionData: expect.any(Function),
      });
    });
  });

  describe("broadcast", () => {
    it("should delegate to logic.broadcast", async () => {
      const mockTxId = "TXID123456";
      (logic.broadcast as jest.Mock).mockResolvedValue(mockTxId);

      const result = await api.broadcast(mockCtx, "deadbeef");

      expect(logic.broadcast).toHaveBeenCalledWith(mockCtx, "deadbeef");
      expect(result).toBe(mockTxId);
    });
  });

  describe("combine", () => {
    it("should delegate to logic.combine", () => {
      const mockSignedTx = "signedTxHex";
      (logic.combine as jest.Mock).mockReturnValue(mockSignedTx);

      const result = api.combine(mockCtx, "unsignedTx", ["signature"]);

      expect(logic.combine).toHaveBeenCalledWith("unsignedTx", ["signature"]);
      expect(result).toBe(mockSignedTx);
    });
  });

  describe("getBalance", () => {
    it("should delegate to logic.getBalance", async () => {
      const mockBalances = [
        { value: 1000000n, asset: { type: "native" }, locked: 100000n },
        { value: 500n, asset: { type: "asa", assetReference: "123" } },
      ];
      (logic.getBalance as jest.Mock).mockResolvedValue(mockBalances);

      const result = await api.getBalance(mockCtx, "TESTADDRESS");

      expect(logic.getBalance).toHaveBeenCalledWith(mockCtx, "TESTADDRESS");
      expect(result).toEqual(mockBalances);
    });

    it("should throw an exception when options is provided", async () => {
      await expect(
        api.getBalance(mockCtx, "random address", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({ name: "InvalidParameterError" });
    });
  });

  describe("lastBlock", () => {
    it("should delegate to logic.lastBlock", async () => {
      const mockBlockInfo = { height: 12345678, hash: "abc123", time: new Date() };
      (logic.lastBlock as jest.Mock).mockResolvedValue(mockBlockInfo);

      const result = await api.lastBlock(mockCtx);

      expect(logic.lastBlock).toHaveBeenCalled();
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("getBlockInfo", () => {
    it("should delegate to logic.getBlockInfo", async () => {
      const mockBlockInfo = { height: 100, hash: "blockhash123", time: new Date() };
      (logic.getBlockInfo as jest.Mock).mockResolvedValue(mockBlockInfo);

      const result = await api.getBlockInfo(mockCtx, 100);

      expect(logic.getBlockInfo).toHaveBeenCalledWith(mockCtx, 100);
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("estimateFees", () => {
    it("should delegate to logic.estimateFees", async () => {
      const mockFees = { value: 1000n };
      (logic.estimateFees as jest.Mock).mockResolvedValue(mockFees);

      const intent = {
        intentType: "transaction" as const,
        type: "send" as const,
        sender: "SENDER",
        recipient: "RECIPIENT",
        amount: 1000000n,
        asset: { type: "native" as const },
        memo: { type: "string" as const, kind: "note" as const, value: "" },
      };
      const result = await api.estimateFees(mockCtx, intent);

      expect(logic.estimateFees).toHaveBeenCalled();
      expect(result).toEqual(mockFees);
    });
  });

  describe("craftTransaction", () => {
    it("should delegate to logic.craftApiTransaction", async () => {
      const mockCrafted = { transaction: "txHex", details: { txPayload: {} } };
      (logic.craftApiTransaction as jest.Mock).mockResolvedValue(mockCrafted);

      const intent = {
        intentType: "transaction" as const,
        type: "send" as const,
        sender: "SENDER",
        recipient: "RECIPIENT",
        amount: 1000000n,
        asset: { type: "native" as const },
        memo: { type: "string" as const, kind: "note" as const, value: "" },
      };
      const result = await api.craftTransaction(mockCtx, intent);

      expect(logic.craftApiTransaction).toHaveBeenCalledWith(mockCtx, intent);
      expect(result).toEqual(mockCrafted);
    });
  });

  describe("listOperations", () => {
    it("should delegate to logic.listOperations", async () => {
      const mockOperations = [
        {
          id: "op1",
          type: "OUT",
          value: 1000000n,
          asset: { type: "native" },
          senders: ["SENDER"],
          recipients: ["RECIPIENT"],
          tx: {
            hash: "hash1",
            block: { height: 100 },
            fees: 1000n,
            date: new Date(),
            failed: false,
          },
        },
      ];
      (logic.listOperations as jest.Mock).mockResolvedValue({ items: mockOperations, next: "" });

      const pagination = { minHeight: 0, order: "asc" as const };
      const { items, next } = await api.listOperations(mockCtx, "TESTADDRESS", pagination);

      expect(logic.listOperations).toHaveBeenCalledWith(mockCtx, "TESTADDRESS", pagination);
      expect(items).toEqual(mockOperations);
      expect(next).toBe("");
    });
  });

  describe("unsupported methods", () => {
    // The consumer path, kept here for what `supports()` reports about the real implementations.
    const resolved = withDefaults(createApi());

    it("keeps the real implementations the module does carry", () => {
      expect(resolved.supports("getBlockInfo")).toBe(true);
      expect(resolved.supports("validateIntent")).toBe(true);
      expect(resolved.supports("validateAddress")).toBe(true);
      expect(resolved.supports("getStakes")).toBe(false);
    });
  });
});
