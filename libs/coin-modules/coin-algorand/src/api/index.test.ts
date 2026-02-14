import type { AlgorandCoinConfig } from "../config";
import * as logic from "../logic";
import { createApi } from "./index";

// Mock the logic module
jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
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

describe("Algorand API", () => {
  let api: ReturnType<typeof createApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = createApi(mockConfig);
  });

  describe("createApi", () => {
    it("should create an API instance with all required methods", () => {
      expect(api).not.toBeUndefined();
      expect(typeof api.broadcast).toBe("function");
      expect(typeof api.combine).toBe("function");
      expect(typeof api.craftTransaction).toBe("function");
      expect(typeof api.estimateFees).toBe("function");
      expect(typeof api.getBalance).toBe("function");
      expect(typeof api.lastBlock).toBe("function");
      expect(typeof api.listOperations).toBe("function");
      expect(typeof api.validateIntent).toBe("function");
      expect(typeof api.getBlock).toBe("function");
      expect(typeof api.getBlockInfo).toBe("function");
      expect(typeof api.getSequence).toBe("function");
      expect(typeof api.getStakes).toBe("function");
      expect(typeof api.getRewards).toBe("function");
      expect(typeof api.getValidators).toBe("function");
    });
  });

  describe("broadcast", () => {
    it("should broadcast a signed transaction", async () => {
      const mockTxId = "TXID123456";
      (logic.broadcast as jest.Mock).mockResolvedValue(mockTxId);

      const result = await api.broadcast("deadbeef");

      expect(logic.broadcast).toHaveBeenCalledWith("deadbeef");
      expect(result).toBe(mockTxId);
    });
  });

  describe("combine", () => {
    it("should combine unsigned tx with signature", () => {
      const mockSignedTx = "signedTxHex";
      (logic.combine as jest.Mock).mockReturnValue(mockSignedTx);

      const result = api.combine("unsignedTx", "signature");

      expect(logic.combine).toHaveBeenCalledWith("unsignedTx", "signature");
      expect(result).toBe(mockSignedTx);
    });
  });

  describe("getBalance", () => {
    it("should return account balances", async () => {
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
    it("should return the last block info", async () => {
      const mockBlockInfo = { height: 12345678, hash: "abc123", time: new Date() };
      (logic.lastBlock as jest.Mock).mockResolvedValue(mockBlockInfo);

      const result = await api.lastBlock();

      expect(logic.lastBlock).toHaveBeenCalled();
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("getBlockInfo", () => {
    it("should return block info for a specific height", async () => {
      const mockBlockInfo = { height: 100, hash: "blockhash123", time: new Date() };
      (logic.getBlockInfo as jest.Mock).mockResolvedValue(mockBlockInfo);

      const result = await api.getBlockInfo(100);

      expect(logic.getBlockInfo).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("estimateFees", () => {
    it("should estimate transaction fees", async () => {
      const mockFees = { value: 1000n };
      (logic.estimateFees as jest.Mock).mockResolvedValue(mockFees);

      const result = await api.estimateFees({
        intentType: "transaction",
        type: "send",
        sender: "SENDER",
        recipient: "RECIPIENT",
        amount: 1000000n,
        asset: { type: "native" },
      });

      expect(logic.estimateFees).toHaveBeenCalled();
      expect(result).toEqual(mockFees);
    });
  });

  describe("craftTransaction", () => {
    it("should craft a native ALGO transaction", async () => {
      const mockCrafted = {
        serializedTransaction: "txHex",
        txPayload: {},
      };
      (logic.craftTransaction as jest.Mock).mockResolvedValue(mockCrafted);
      (logic.estimateFees as jest.Mock).mockResolvedValue({ value: 1000n });

      const result = await api.craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: "SENDER",
        recipient: "RECIPIENT",
        amount: 1000000n,
        asset: { type: "native" },
      });

      expect(logic.craftTransaction).toHaveBeenCalledWith({
        sender: "SENDER",
        recipient: "RECIPIENT",
        amount: 1000000n,
        memo: undefined,
        assetId: undefined,
        fees: 1000n,
      });
      expect(result.transaction).toBe("txHex");
    });

    it("should craft an ASA token transaction", async () => {
      const mockCrafted = {
        serializedTransaction: "asaTxHex",
        txPayload: {},
      };
      (logic.craftTransaction as jest.Mock).mockResolvedValue(mockCrafted);
      (logic.estimateFees as jest.Mock).mockResolvedValue({ value: 1000n });

      const result = await api.craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: "SENDER",
        recipient: "RECIPIENT",
        amount: 500n,
        asset: { type: "asa", assetReference: "123456" },
      });

      expect(logic.craftTransaction).toHaveBeenCalledWith({
        sender: "SENDER",
        recipient: "RECIPIENT",
        amount: 500n,
        memo: undefined,
        assetId: "123456",
        fees: 1000n,
      });
      expect(result.transaction).toBe("asaTxHex");
    });
  });

  describe("listOperations", () => {
    it("should list account operations", async () => {
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
      (logic.listOperations as jest.Mock).mockResolvedValue([mockOperations, ""]);

      const [operations, nextToken] = await api.listOperations("TESTADDRESS", {
        minHeight: 0,
        order: "asc",
      });

      expect(logic.listOperations).toHaveBeenCalledWith("TESTADDRESS", {
        minHeight: 0,
        order: "asc",
      });
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

    it("craftRawTransaction should throw not supported error", async () => {
      await expect(api.craftRawTransaction("tx", "sender", "pubkey", 0n)).rejects.toThrow(
        "craftRawTransaction is not supported for Algorand",
      );
    });
  });
});
