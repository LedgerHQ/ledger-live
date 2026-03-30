import {
  withClient,
  getConsensusInfo,
  getBlockInfoByHash,
  getBlocksAtHeight,
  getAccountsByPublicKey,
  getAccountBalance,
  getAccountNonce,
  getTransactions,
  getTransactionCost,
  submitTransfer,
  submitCredential,
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
      proxyUrl: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com",
    }),
  },
}));

const currencyId = "concordium_testnet";

describe("proxyClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetwork.mockReset();
  });

  describe("withClient", () => {
    it("should execute function with client", async () => {
      mockNetwork.mockResolvedValue({ data: "result" });

      const result = await withClient(currencyId, async client => {
        return client.request({ method: "GET", url: "/test" });
      });

      expect(result).toBe("result");
    });

    it("should retry on failure", async () => {
      mockNetwork
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce({ data: "success" });

      const result = await withClient(
        currencyId,
        async client => client.request({ method: "GET", url: "/test" }),
        1,
      );

      expect(result).toBe("success");
      expect(mockNetwork).toHaveBeenCalledTimes(2);
    }, 10000);

    it("should throw after all retries exhausted", async () => {
      mockNetwork.mockRejectedValue(new Error("Always fails"));

      await expect(
        withClient(currencyId, async client => client.request({ method: "GET", url: "/test" }), 1),
      ).rejects.toThrow("Always fails");
      expect(mockNetwork).toHaveBeenCalledTimes(2);
    }, 10000);

    it("should use default retries when not specified", async () => {
      mockNetwork.mockRejectedValue(new Error("Fails"));

      await expect(
        withClient(currencyId, async client => client.request({ method: "GET", url: "/test" })),
      ).rejects.toThrow("Fails");
      expect(mockNetwork).toHaveBeenCalledTimes(3); // DEFAULT_RETRIES = 2
    }, 10000);

    it("should throw when URL is not provided", async () => {
      await expect(
        withClient(currencyId, async client => client.request({ method: "GET" } as any)),
      ).rejects.toThrow("URL is required for proxy client requests");
    });

    it("should cache client by currency id", async () => {
      mockNetwork.mockResolvedValue({ data: "result" });

      await withClient(currencyId, async client =>
        client.request({ method: "GET", url: "/test1" }),
      );
      await withClient(currencyId, async client =>
        client.request({ method: "GET", url: "/test2" }),
      );

      // Both calls should use same base URL (client was cached)
      expect(mockNetwork).toHaveBeenCalledTimes(2);
      expect(mockNetwork.mock.calls[0][0].url).toBe(
        "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/test1",
      );
      expect(mockNetwork.mock.calls[1][0].url).toBe(
        "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/test2",
      );
    });
  });

  describe("getConsensusInfo", () => {
    it("should fetch consensus info", async () => {
      const mockResponse = {
        bestBlock: "abc123",
        bestBlockHeight: 1000,
        genesisBlock: "genesis123",
        genesisTime: "2021-06-09T10:00:00Z",
        lastFinalizedBlock: "def456",
        lastFinalizedBlockHeight: 999,
        lastFinalizedTime: "2024-01-15T10:30:00Z",
        epochDuration: 3600000,
        protocolVersion: 6,
        genesisIndex: 0,
        currentEraGenesisBlock: "era123",
        currentEraGenesisTime: "2021-06-09T10:00:00Z",
      };
      mockNetwork.mockResolvedValue({ data: mockResponse });

      const result = await getConsensusInfo(currencyId);

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v0/consensusInfo",
        }),
      );
    });
  });

  describe("getBlockInfoByHash", () => {
    it("should fetch block info by hash", async () => {
      const mockResponse = {
        blockHash: "abc123",
        blockHeight: 1000,
        blockSlotTime: "2024-01-15T10:00:00.000Z",
        blockParent: "parent123",
        finalized: true,
        transactionCount: 5,
      };
      mockNetwork.mockResolvedValue({ data: mockResponse });

      const result = await getBlockInfoByHash(currencyId, "abc123");

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v0/blockInfo/abc123",
        }),
      );
    });
  });

  describe("getBlocksAtHeight", () => {
    it("should fetch block hashes at height", async () => {
      const mockResponse = ["abc123", "def456"];
      mockNetwork.mockResolvedValue({ data: mockResponse });

      const result = await getBlocksAtHeight(currencyId, 1000);

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v0/blocksAtHeight/1000",
        }),
      );
    });
  });

  describe("getAccountsByPublicKey", () => {
    it("should fetch accounts by public key", async () => {
      const mockResponse = [{ address: "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w" }];
      mockNetwork.mockResolvedValue({ data: mockResponse });

      const result = await getAccountsByPublicKey(currencyId, "aa".repeat(32));

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: `https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v0/keyAccounts/${"aa".repeat(32)}`,
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

      const result = await getAccountBalance(currencyId, "test-address");

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v2/accBalance/test-address",
        }),
      );
    });
  });

  describe("getAccountNonce", () => {
    it("should fetch account nonce", async () => {
      const mockResponse = { nonce: 5 };
      mockNetwork.mockResolvedValue({ data: mockResponse });

      const result = await getAccountNonce(currencyId, "test-address");

      expect(result).toEqual({ nonce: 5 });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v0/accNonce/test-address",
        }),
      );
    });
  });

  describe("getTransactions", () => {
    it("should fetch transactions without params", async () => {
      const mockResponse = { transactions: [] };
      mockNetwork.mockResolvedValue({ data: mockResponse });

      const result = await getTransactions(currencyId, "test-address");

      expect(result).toEqual({ transactions: [] });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v3/accTransactions/test-address",
        }),
      );
    });

    it("should fetch transactions with params", async () => {
      const mockResponse = { transactions: [] };
      mockNetwork.mockResolvedValue({ data: mockResponse });

      await getTransactions(currencyId, "test-address", { limit: 50, order: "d" });

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

      const result = await getTransactionCost(currencyId, { numSignatures: 1 });

      expect(result).toEqual({ cost: "1000", energy: "500" });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v0/transactionCost",
          params: { type: "simpleTransfer", numSignatures: 1 },
        }),
      );
    });
  });

  describe("submitTransfer", () => {
    it("should submit transfer transaction", async () => {
      mockNetwork.mockResolvedValue({ data: { submissionId: "tx-123" } });

      const result = await submitTransfer(currencyId, {
        transaction: "transaction-body-hex",
        signatures: { "0": { "0": "signature-hex" } },
      });

      expect(result).toEqual({ submissionId: "tx-123" });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v0/submitTransfer/",
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
      const credentialData = {
        credential: { value: { credential: {} } },
      } as any;

      const result = await submitCredential(currencyId, credentialData);

      expect(result).toEqual({ submissionId: "cred-123" });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          url: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com/v0/submitCredential/",
          data: credentialData,
        }),
      );
    });
  });
});
