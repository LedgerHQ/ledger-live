import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import {
  withClient,
  getAccountsByPublicKey,
  getAccountBalance,
  getAccountNonce,
  getTransactions,
  getTransactionCost,
  submitTransfer,
  submitCredential,
  getOperations,
} from "./proxyClient";

// Mock live-network
const mockNetwork = jest.fn();
jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockNetwork(...args),
}));

jest.mock("../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: jest.fn().mockReturnValue({
      proxyUrl: "https://wallet-proxy.concordium.com",
    }),
  },
}));

const createMockCurrency = (): CryptoCurrency =>
  ({
    id: "concordium",
    family: "concordium",
  }) as CryptoCurrency;

describe("proxyClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetwork.mockReset();
  });

  describe("withClient", () => {
    it("should execute function with client", async () => {
      mockNetwork.mockResolvedValue({ data: "result" });
      const currency = createMockCurrency();

      const result = await withClient(currency, async client => {
        return client.request({ method: "GET", url: "/test" });
      });

      expect(result).toBe("result");
    });

    it("should retry on failure", async () => {
      mockNetwork
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce({ data: "success" });

      const currency = createMockCurrency();

      const result = await withClient(
        currency,
        async client => client.request({ method: "GET", url: "/test" }),
        1,
      );

      expect(result).toBe("success");
      expect(mockNetwork).toHaveBeenCalledTimes(2);
    }, 10000);

    it("should throw after all retries exhausted", async () => {
      mockNetwork.mockRejectedValue(new Error("Always fails"));
      const currency = createMockCurrency();

      await expect(
        withClient(currency, async client => client.request({ method: "GET", url: "/test" }), 1),
      ).rejects.toThrow("Always fails");
      expect(mockNetwork).toHaveBeenCalledTimes(2);
    }, 10000);

    it("should use default retries when not specified", async () => {
      mockNetwork.mockRejectedValue(new Error("Fails"));
      const currency = createMockCurrency();

      await expect(
        withClient(currency, async client => client.request({ method: "GET", url: "/test" })),
      ).rejects.toThrow("Fails");
      expect(mockNetwork).toHaveBeenCalledTimes(3); // DEFAULT_RETRIES = 2
    }, 10000);

    it("should throw when URL is not provided", async () => {
      const currency = createMockCurrency();

      await expect(
        withClient(currency, async client => client.request({ method: "GET" } as any)),
      ).rejects.toThrow("URL is required for proxy client requests");
    });

    it("should cache client by currency id", async () => {
      mockNetwork.mockResolvedValue({ data: "result" });
      const currency = createMockCurrency();

      await withClient(currency, async client => client.request({ method: "GET", url: "/test1" }));
      await withClient(currency, async client => client.request({ method: "GET", url: "/test2" }));

      // Both calls should use same base URL (client was cached)
      expect(mockNetwork).toHaveBeenCalledTimes(2);
      expect(mockNetwork.mock.calls[0][0].url).toBe("https://wallet-proxy.concordium.com/test1");
      expect(mockNetwork.mock.calls[1][0].url).toBe("https://wallet-proxy.concordium.com/test2");
    });
  });

  describe("getAccountsByPublicKey", () => {
    it("should fetch accounts by public key", async () => {
      const mockResponse = [{ address: "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w" }];
      mockNetwork.mockResolvedValue({ data: mockResponse });
      const currency = createMockCurrency();

      const result = await getAccountsByPublicKey(currency, "aa".repeat(32));

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: `https://wallet-proxy.concordium.com/v0/keyAccounts/${"aa".repeat(32)}`,
        }),
      );
    });
  });

  describe("getAccountBalance", () => {
    it("should fetch account balance", async () => {
      const mockResponse = {
        finalizedBalance: {
          accountAmount: "10000000",
          accountAtDisposal: "9900000",
        },
      };
      mockNetwork.mockResolvedValue({ data: mockResponse });
      const currency = createMockCurrency();

      const result = await getAccountBalance(currency, "test-address");

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://wallet-proxy.concordium.com/v2/accBalance/test-address",
        }),
      );
    });
  });

  describe("getAccountNonce", () => {
    it("should fetch account nonce", async () => {
      const mockResponse = { nonce: 5 };
      mockNetwork.mockResolvedValue({ data: mockResponse });
      const currency = createMockCurrency();

      const result = await getAccountNonce(currency, "test-address");

      expect(result).toEqual({ nonce: 5 });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://wallet-proxy.concordium.com/v0/accNonce/test-address",
        }),
      );
    });
  });

  describe("getTransactions", () => {
    it("should fetch transactions without params", async () => {
      const mockResponse = { transactions: [] };
      mockNetwork.mockResolvedValue({ data: mockResponse });
      const currency = createMockCurrency();

      const result = await getTransactions(currency, "test-address");

      expect(result).toEqual({ transactions: [] });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://wallet-proxy.concordium.com/v3/accTransactions/test-address",
        }),
      );
    });

    it("should fetch transactions with params", async () => {
      const mockResponse = { transactions: [] };
      mockNetwork.mockResolvedValue({ data: mockResponse });
      const currency = createMockCurrency();

      await getTransactions(currency, "test-address", { limit: 50, order: "d" });

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 50, order: "d" },
        }),
      );
    });
  });

  describe("getTransactionCost", () => {
    it("should fetch transaction cost", async () => {
      mockNetwork.mockResolvedValue({ data: { cost: "1000", energy: "500" } });
      const currency = createMockCurrency();

      const result = await getTransactionCost(currency, 1);

      expect(result).toEqual({ cost: "1000", energy: "500" });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://wallet-proxy.concordium.com/v0/transactionCost",
          params: { type: "simpleTransfer", numSignatures: 1 },
        }),
      );
    });
  });

  describe("submitTransfer", () => {
    it("should submit transfer transaction", async () => {
      mockNetwork.mockResolvedValue({ data: { submissionId: "tx-123" } });
      const currency = createMockCurrency();

      const result = await submitTransfer(currency, "transaction-body-hex", "signature-hex");

      expect(result).toEqual({ submissionId: "tx-123" });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          url: "https://wallet-proxy.concordium.com/v0/submitTransfer/",
          data: {
            transaction: "transaction-body-hex",
            signatures: {
              "0": {
                "0": "signature-hex",
              },
            },
          },
        }),
      );
    });
  });

  describe("submitCredential", () => {
    it("should submit credential deployment", async () => {
      mockNetwork.mockResolvedValue({ data: { submissionId: "cred-123" } });
      const currency = createMockCurrency();
      const credentialData = {
        credential: { value: { credential: {} } },
      } as any;

      const result = await submitCredential(currency, credentialData);

      expect(result).toEqual({ submissionId: "cred-123" });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          url: "https://wallet-proxy.concordium.com/v0/submitCredential/",
          data: credentialData,
        }),
      );
    });
  });

  describe("getOperations", () => {
    it("should return empty array on network error", async () => {
      mockNetwork.mockRejectedValue(new Error("Network error"));
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toEqual([]);
    });

    it("should return empty array for non-transaction response", async () => {
      mockNetwork.mockResolvedValue({ data: { error: "something" } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toEqual([]);
    });

    it("should convert transfer transactions to operations", async () => {
      const mockTx = {
        id: 1,
        transactionHash: "abc123",
        blockHash: "block123",
        blockTime: 1700000000,
        cost: "1000",
        details: {
          type: "transfer",
          transferSource: "sender-address",
          transferDestination: "test-address",
          transferAmount: "5000000",
        },
      };
      mockNetwork.mockResolvedValue({ data: { transactions: [mockTx] } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("IN");
      expect(result[0].hash).toBe("abc123");
      expect(result[0].value).toEqual(new BigNumber(5000000));
    });

    it("should handle outgoing transfers with fee", async () => {
      const mockTx = {
        id: 1,
        transactionHash: "abc123",
        blockHash: "block123",
        blockTime: 1700000000,
        cost: "1000",
        details: {
          type: "transfer",
          transferSource: "test-address",
          transferDestination: "recipient-address",
          transferAmount: "5000000",
        },
      };
      mockNetwork.mockResolvedValue({ data: { transactions: [mockTx] } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("OUT");
      // value = transferAmount + fee
      expect(result[0].value).toEqual(new BigNumber(5001000));
      expect(result[0].fee).toEqual(new BigNumber(1000));
    });

    it("should handle transferWithMemo transactions", async () => {
      const mockTx = {
        id: 1,
        transactionHash: "abc123",
        blockHash: "block123",
        blockTime: 1700000000,
        cost: "1000",
        details: {
          type: "transferWithMemo",
          transferSource: "sender-address",
          transferDestination: "test-address",
          transferAmount: "5000000",
          memo: "6474657374", // CBOR encoded "test"
        },
      };
      mockNetwork.mockResolvedValue({ data: { transactions: [mockTx] } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toHaveLength(1);
      expect(result[0].extra).not.toBeUndefined();
    });

    it("should fetch all transactions without pagination", async () => {
      const mockTxs = [
        {
          id: 1,
          transactionHash: "tx1",
          blockHash: "block1",
          blockTime: 1700000000,
          cost: "1000",
          details: {
            type: "transfer",
            transferSource: "sender",
            transferDestination: "test-address",
            transferAmount: "1000",
          },
        },
        {
          id: 5,
          transactionHash: "tx5",
          blockHash: "block5",
          blockTime: 1700000001,
          cost: "1000",
          details: {
            type: "transfer",
            transferSource: "sender",
            transferDestination: "test-address",
            transferAmount: "1000",
          },
        },
      ];
      mockNetwork.mockResolvedValue({ data: { transactions: mockTxs } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.not.objectContaining({
            from: expect.anything(),
          }),
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].hash).toBe("tx1");
      expect(result[1].hash).toBe("tx5");
    });

    it("should skip non-transfer transactions", async () => {
      const mockTx = {
        id: 1,
        transactionHash: "abc123",
        blockHash: "block123",
        blockTime: 1700000000,
        cost: "1000",
        details: {
          type: "deployModule",
        },
      };
      mockNetwork.mockResolvedValue({ data: { transactions: [mockTx] } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toEqual([]);
    });

    it("should skip transactions not involving the address", async () => {
      const mockTx = {
        id: 1,
        transactionHash: "abc123",
        blockHash: "block123",
        blockTime: 1700000000,
        cost: "1000",
        details: {
          type: "transfer",
          transferSource: "other-address",
          transferDestination: "another-address",
          transferAmount: "5000000",
        },
      };
      mockNetwork.mockResolvedValue({ data: { transactions: [mockTx] } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toEqual([]);
    });

    it("should use default size when not specified", async () => {
      mockNetwork.mockResolvedValue({ data: { transactions: [] } });
      const currency = createMockCurrency();

      await getOperations(currency, "test-address", "account-id");

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 100, order: "d" },
        }),
      );
    });

    it("should use provided size param", async () => {
      mockNetwork.mockResolvedValue({ data: { transactions: [] } });
      const currency = createMockCurrency();

      await getOperations(currency, "test-address", "account-id", { size: 50 });

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 50, order: "d" },
        }),
      );
    });

    it("should handle missing cost in transaction", async () => {
      const mockTx = {
        id: 1,
        transactionHash: "abc123",
        blockHash: "block123",
        blockTime: 1700000000,
        details: {
          type: "transfer",
          transferSource: "sender-address",
          transferDestination: "test-address",
          transferAmount: "5000000",
        },
      };
      mockNetwork.mockResolvedValue({ data: { transactions: [mockTx] } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toHaveLength(1);
      expect(result[0].fee).toEqual(new BigNumber(0));
    });

    it("should handle missing transferAmount", async () => {
      const mockTx = {
        id: 1,
        transactionHash: "abc123",
        blockHash: "block123",
        blockTime: 1700000000,
        cost: "1000",
        details: {
          type: "transfer",
          transferSource: "sender-address",
          transferDestination: "test-address",
        },
      };
      mockNetwork.mockResolvedValue({ data: { transactions: [mockTx] } });
      const currency = createMockCurrency();

      const result = await getOperations(currency, "test-address", "account-id");

      expect(result).toHaveLength(1);
      expect(result[0].value).toEqual(new BigNumber(0));
    });
  });
});
