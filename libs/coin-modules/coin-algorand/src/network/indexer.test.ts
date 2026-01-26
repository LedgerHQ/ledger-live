import network from "@ledgerhq/live-network";
import { BigNumber } from "bignumber.js";
import { getAccountTransactions, getAllAccountTransactions } from "./indexer";

jest.mock("@ledgerhq/live-network");
jest.mock("../config", () => ({
  getCoinConfig: jest.fn().mockReturnValue({
    indexer: "https://algorand-indexer.example.com",
  }),
}));

const mockNetwork = network as jest.MockedFunction<typeof network>;

describe("indexer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccountTransactions", () => {
    it("should fetch and parse payment transactions", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          transactions: [
            {
              id: "TX_123",
              "round-time": 1700000000,
              "confirmed-round": 50000000,
              sender: "SENDER_ADDRESS",
              "sender-rewards": 100,
              "receiver-rewards": 50,
              fee: 1000,
              note: "test note",
              "tx-type": "pay",
              "payment-transaction": {
                amount: 1000000,
                receiver: "RECIPIENT_ADDRESS",
              },
            },
          ],
          "next-token": undefined,
        },
      } as never);

      const result = await getAccountTransactions("ALGO_ADDRESS");

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].id).toBe("TX_123");
      expect(result.transactions[0].type).toBe("pay");
      expect(result.transactions[0].senderAddress).toBe("SENDER_ADDRESS");
      expect(result.transactions[0].fee).toBeInstanceOf(BigNumber);
      expect(result.nextToken).toBeUndefined();
    });

    it("should fetch and parse asset transfer transactions", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          transactions: [
            {
              id: "TX_456",
              "round-time": 1700000100,
              "confirmed-round": 50000100,
              sender: "SENDER_ADDRESS",
              "sender-rewards": 0,
              "receiver-rewards": 0,
              fee: 1000,
              "tx-type": "axfer",
              "asset-transfer-transaction": {
                amount: 100,
                "asset-id": 12345,
                receiver: "RECIPIENT_ADDRESS",
              },
            },
          ],
        },
      } as never);

      const result = await getAccountTransactions("ALGO_ADDRESS");

      expect(result.transactions[0].type).toBe("axfer");
      expect(result.transactions[0].details).not.toBeUndefined();
    });

    it("should include minRound in URL when provided", async () => {
      mockNetwork.mockResolvedValue({
        data: { transactions: [] },
      } as never);

      await getAccountTransactions("ALGO_ADDRESS", { minRound: 50000000 });

      expect(mockNetwork).toHaveBeenCalledWith({
        url: expect.stringContaining("min-round=50000000"),
      });
    });

    it("should include nextToken in URL when provided", async () => {
      mockNetwork.mockResolvedValue({
        data: { transactions: [] },
      } as never);

      await getAccountTransactions("ALGO_ADDRESS", { nextToken: "abc123" });

      expect(mockNetwork).toHaveBeenCalledWith({
        url: expect.stringContaining("next=abc123"),
      });
    });

    it("should return next token when present", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          transactions: [],
          "next-token": "next_page_token",
        },
      } as never);

      const result = await getAccountTransactions("ALGO_ADDRESS");

      expect(result.nextToken).toBe("next_page_token");
    });

    it("should handle close amounts in payment transactions", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          transactions: [
            {
              id: "TX_CLOSE",
              "round-time": 1700000000,
              "confirmed-round": 50000000,
              sender: "SENDER",
              "sender-rewards": 0,
              "receiver-rewards": 0,
              "close-rewards": 100,
              "closing-amount": 500000,
              fee: 1000,
              "tx-type": "pay",
              "payment-transaction": {
                amount: 1000000,
                receiver: "RECIPIENT",
                "close-amount": 500000,
                "close-remainder-to": "CLOSE_TO_ADDRESS",
              },
            },
          ],
        },
      } as never);

      const result = await getAccountTransactions("ALGO_ADDRESS");

      expect(result.transactions[0].closeRewards).toBeInstanceOf(BigNumber);
      expect(result.transactions[0].closeAmount).toBeInstanceOf(BigNumber);
    });
  });

  describe("getAllAccountTransactions", () => {
    it("should fetch all transactions without pagination", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          transactions: [
            {
              id: "TX_1",
              "round-time": 1700000000,
              "confirmed-round": 50000000,
              sender: "SENDER",
              "sender-rewards": 0,
              "receiver-rewards": 0,
              fee: 1000,
              "tx-type": "pay",
              "payment-transaction": {
                amount: 100,
                receiver: "RECIPIENT",
              },
            },
          ],
        },
      } as never);

      const result = await getAllAccountTransactions("ALGO_ADDRESS");

      expect(result).toHaveLength(1);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
    });

    it("should paginate through all results", async () => {
      mockNetwork
        .mockResolvedValueOnce({
          data: {
            transactions: [
              {
                id: "TX_1",
                "round-time": 1700000000,
                "confirmed-round": 50000000,
                sender: "SENDER",
                "sender-rewards": 0,
                "receiver-rewards": 0,
                fee: 1000,
                "tx-type": "pay",
                "payment-transaction": { amount: 100, receiver: "R1" },
              },
            ],
            "next-token": "page2",
          },
        } as never)
        .mockResolvedValueOnce({
          data: {
            transactions: [
              {
                id: "TX_2",
                "round-time": 1700000100,
                "confirmed-round": 50000100,
                sender: "SENDER",
                "sender-rewards": 0,
                "receiver-rewards": 0,
                fee: 1000,
                "tx-type": "pay",
                "payment-transaction": { amount: 200, receiver: "R2" },
              },
            ],
            "next-token": "page3",
          },
        } as never)
        .mockResolvedValueOnce({
          data: {
            transactions: [
              {
                id: "TX_3",
                "round-time": 1700000200,
                "confirmed-round": 50000200,
                sender: "SENDER",
                "sender-rewards": 0,
                "receiver-rewards": 0,
                fee: 1000,
                "tx-type": "pay",
                "payment-transaction": { amount: 300, receiver: "R3" },
              },
            ],
          },
        } as never);

      const result = await getAllAccountTransactions("ALGO_ADDRESS");

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("TX_1");
      expect(result[1].id).toBe("TX_2");
      expect(result[2].id).toBe("TX_3");
      expect(mockNetwork).toHaveBeenCalledTimes(3);
    });

    it("should pass startAt as minRound", async () => {
      mockNetwork.mockResolvedValue({
        data: { transactions: [] },
      } as never);

      await getAllAccountTransactions("ALGO_ADDRESS", 50000000);

      expect(mockNetwork).toHaveBeenCalledWith({
        url: expect.stringContaining("min-round=50000000"),
      });
    });

    it("should handle empty transaction list", async () => {
      mockNetwork.mockResolvedValue({
        data: { transactions: [] },
      } as never);

      const result = await getAllAccountTransactions("ALGO_ADDRESS");

      expect(result).toEqual([]);
    });
  });
});
