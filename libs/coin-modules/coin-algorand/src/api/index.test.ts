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
  listApiOperations: jest.fn(),
  validateIntent: jest.fn(),
}));

const mockConfig: AlgorandCoinConfig = {
  node: "https://testnet-api.algonode.cloud/v2",
  indexer: "https://testnet-idx.algonode.cloud/v2",
  status: { type: "active" },
};

describe("Algorand API", () => {
  let api: ReturnType<typeof createApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = createApi(mockConfig);
  });

  describe("createApi", () => {
    it("should create an API instance with all required methods", () => {
      expect(api).toEqual({
        broadcast: expect.any(Function),
        combine: expect.any(Function),
        craftTransaction: expect.any(Function),
        craftRawTransaction: expect.any(Function),
        estimateFees: expect.any(Function),
        getBalance: logic.getBalance,
        getBlock: expect.any(Function),
        getBlockInfo: expect.any(Function),
        getRewards: expect.any(Function),
        getSequence: expect.any(Function),
        getStakes: expect.any(Function),
        getValidators: expect.any(Function),
        lastBlock: logic.lastBlock,
        listOperations: expect.any(Function),
        validateIntent: expect.any(Function),
      });
    });
  });

  describe("broadcast", () => {
    it("should delegate to logic.broadcast", async () => {
      const mockTxId = "TXID123456";
      (logic.broadcast as jest.Mock).mockResolvedValue(mockTxId);

      const result = await api.broadcast("deadbeef");

      expect(logic.broadcast).toHaveBeenCalledWith("deadbeef");
      expect(result).toBe(mockTxId);
    });
  });

  describe("combine", () => {
    it("should delegate to logic.combine", () => {
      const mockSignedTx = "signedTxHex";
      (logic.combine as jest.Mock).mockReturnValue(mockSignedTx);

      const result = api.combine("unsignedTx", "signature");

      expect(logic.combine).toHaveBeenCalledWith("unsignedTx", "signature");
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

      const result = await api.getBalance("TESTADDRESS");

      expect(logic.getBalance).toHaveBeenCalledWith("TESTADDRESS");
      expect(result).toEqual(mockBalances);
    });
  });

  describe("lastBlock", () => {
    it("should delegate to logic.lastBlock", async () => {
      const mockBlockInfo = { height: 12345678, hash: "abc123", time: new Date() };
      (logic.lastBlock as jest.Mock).mockResolvedValue(mockBlockInfo);

      const result = await api.lastBlock();

      expect(logic.lastBlock).toHaveBeenCalled();
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("getBlockInfo", () => {
    it("should delegate to logic.getBlockInfo", async () => {
      const mockBlockInfo = { height: 100, hash: "blockhash123", time: new Date() };
      (logic.getBlockInfo as jest.Mock).mockResolvedValue(mockBlockInfo);

      const result = await api.getBlockInfo(100);

      expect(logic.getBlockInfo).toHaveBeenCalledWith(100);
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
      const result = await api.estimateFees(intent);

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
      const result = await api.craftTransaction(intent);

      expect(logic.craftApiTransaction).toHaveBeenCalledWith(intent);
      expect(result).toEqual(mockCrafted);
    });
  });

  describe("listOperations", () => {
    it("should delegate to logic.listApiOperations", async () => {
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
      (logic.listApiOperations as jest.Mock).mockResolvedValue([mockOperations, ""]);

      const pagination = { minHeight: 0, order: "asc" as const };
      const [operations, nextToken] = await api.listOperations("TESTADDRESS", pagination);

      expect(logic.listApiOperations).toHaveBeenCalledWith("TESTADDRESS", pagination);
      expect(operations).toEqual(mockOperations);
      expect(nextToken).toBe("");
    });
  });

  describe("unsupported methods", () => {
    it("getBlock should throw not supported error", () => {
      expect(() => api.getBlock(100)).toThrow("getBlock is not supported for Algorand");
    });

    it("getSequence should throw not applicable error", () => {
      expect(() => api.getSequence("ADDRESS")).toThrow(
        "getSequence is not applicable for Algorand",
      );
    });

    it("getStakes should throw not supported error", () => {
      expect(() => api.getStakes("ADDRESS")).toThrow("getStakes is not supported for Algorand");
    });

    it("getRewards should throw not supported error", () => {
      expect(() => api.getRewards("ADDRESS")).toThrow("getRewards is not supported for Algorand");
    });

    it("getValidators should throw not supported error", () => {
      expect(() => api.getValidators()).toThrow("getValidators is not supported for Algorand");
    });

    it("craftRawTransaction should throw not supported error", () => {
      expect(() => api.craftRawTransaction("tx", "sender", "pubkey", 0n)).toThrow(
        "craftRawTransaction is not supported for Algorand",
      );
    });
  });
});
