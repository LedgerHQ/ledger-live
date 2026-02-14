import network from "@ledgerhq/live-network";
import { BigNumber } from "bignumber.js";
import { getAccount, getTransactionParams, broadcastTransaction } from "./algod";

jest.mock("@ledgerhq/live-network");
jest.mock("../config", () => ({
  getCoinConfig: jest.fn().mockReturnValue({
    node: "https://algorand-node.example.com",
  }),
}));

const mockNetwork = network as jest.MockedFunction<typeof network>;

describe("algod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccount", () => {
    it("should fetch and transform account data", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          round: 50000000,
          address: "ALGO_ADDRESS",
          amount: 10000000,
          "pending-rewards": 5000,
          assets: [
            { "asset-id": 12345, amount: 100 },
            { "asset-id": 67890, amount: 200 },
          ],
        },
      } as never);

      const result = await getAccount("ALGO_ADDRESS");

      expect(result.round).toBe(50000000);
      expect(result.address).toBe("ALGO_ADDRESS");
      expect(result.balance).toBeInstanceOf(BigNumber);
      expect(result.balance.toString()).toBe("10000000");
      expect(result.pendingRewards).toBeInstanceOf(BigNumber);
      expect(result.pendingRewards.toString()).toBe("5000");
      expect(result.assets).toHaveLength(2);
      expect(result.assets[0]).toEqual({
        assetId: "12345",
        balance: expect.any(BigNumber),
      });
    });

    it("should handle account with no assets", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          round: 50000000,
          address: "ALGO_ADDRESS",
          amount: 5000000,
          "pending-rewards": 0,
          assets: null,
        },
      } as never);

      const result = await getAccount("ALGO_ADDRESS");

      expect(result.assets).toEqual([]);
    });

    it("should handle account with empty assets array", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          round: 50000000,
          address: "ALGO_ADDRESS",
          amount: 5000000,
          "pending-rewards": 0,
          assets: [],
        },
      } as never);

      const result = await getAccount("ALGO_ADDRESS");

      expect(result.assets).toEqual([]);
    });

    it("should call correct URL", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          round: 1,
          address: "TEST",
          amount: 0,
          "pending-rewards": 0,
          assets: [],
        },
      } as never);

      await getAccount("TEST_ADDRESS");

      expect(mockNetwork).toHaveBeenCalledWith({
        url: "https://algorand-node.example.com/accounts/TEST_ADDRESS",
      });
    });
  });

  describe("getTransactionParams", () => {
    it("should fetch and transform transaction params", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          fee: 0,
          "min-fee": 1000,
          "first-round": 50000000,
          "last-round": 50001000,
          "genesis-id": "mainnet-v1.0",
          "genesis-hash": "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
        },
      } as never);

      const result = await getTransactionParams();

      expect(result.fee).toBe(0);
      expect(result.minFee).toBe(1000);
      expect(result.firstRound).toBe(50000000);
      expect(result.lastRound).toBe(50001000);
      expect(result.genesisID).toBe("mainnet-v1.0");
      expect(result.genesisHash).toBe("wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=");
    });

    it("should handle missing first-round", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          fee: 0,
          "min-fee": 1000,
          "first-round": undefined,
          "last-round": 50001000,
          "genesis-id": "mainnet-v1.0",
          "genesis-hash": "hash",
        },
      } as never);

      const result = await getTransactionParams();

      expect(result.firstRound).toBe(0);
    });

    it("should call correct URL", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          fee: 0,
          "min-fee": 1000,
          "last-round": 1000,
          "genesis-id": "mainnet-v1.0",
          "genesis-hash": "hash",
        },
      } as never);

      await getTransactionParams();

      expect(mockNetwork).toHaveBeenCalledWith({
        url: "https://algorand-node.example.com/transactions/params",
      });
    });
  });

  describe("broadcastTransaction", () => {
    it("should broadcast transaction and return txId", async () => {
      mockNetwork.mockResolvedValue({
        data: { txId: "TX_HASH_12345" },
      } as never);

      const payload = Buffer.from("signed_transaction");
      const result = await broadcastTransaction(payload);

      expect(result).toBe("TX_HASH_12345");
    });

    it("should call correct URL with POST method", async () => {
      mockNetwork.mockResolvedValue({
        data: { txId: "TX_HASH" },
      } as never);

      const payload = Buffer.from("tx_data");
      await broadcastTransaction(payload);

      expect(mockNetwork).toHaveBeenCalledWith({
        method: "POST",
        url: "https://algorand-node.example.com/transactions",
        data: payload,
        headers: { "Content-Type": "application/x-binary" },
      });
    });

    it("should propagate network errors", async () => {
      mockNetwork.mockRejectedValue(new Error("Broadcast failed"));

      const payload = Buffer.from("bad_tx");

      await expect(broadcastTransaction(payload)).rejects.toThrow("Broadcast failed");
    });
  });
});
