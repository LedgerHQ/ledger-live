import * as env from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import {
  fetchBalances,
  fetchTokenBalancesPage,
  fetchAllTokenBalances,
  fetchEstimatedFees,
  fetchBlockHeight,
  fetchTransactionsPage,
  fetchAllTransactions,
  fetchFullTxs,
  broadcastTx,
  fetchMempoolTransactionsPage,
  fetchFullMempoolTxs,
  fetchNonce,
} from "./api";
import { EstimatedFeesRequest } from "./api.types";

jest.mock("@ledgerhq/live-env");
jest.mock("@ledgerhq/live-network/network");
jest.mock("./transformers");
jest.mock("./api", () => {
  const originalModule = jest.requireActual("./api");
  return {
    ...originalModule,
    fetchAllTransactions: jest.fn().mockImplementation(async _address => {
      return [
        { tx_id: "0xabc123", tx_type: "token_transfer" },
        { tx_id: "0xdef456", tx_type: "contract_call" },
        { tx_id: "0xghi789", tx_type: "token_transfer" },
      ];
    }),
    fetchFullTxs: jest.fn().mockImplementation(async _address => {
      const tokenTransfers = [{ tx_id: "0xabc123", tx_type: "token_transfer" }];
      const sendManyTransactions = [{ tx_id: "0xjkl012", tx_type: "contract_call" }];
      const contractTransactions = {
        "SP123.CONTRACT-A": [{ tx_id: "0xdef456", tx_type: "contract_call" }],
      };
      return [[...tokenTransfers, ...sendManyTransactions], contractTransactions];
    }),
  };
});

describe("Stacks API", () => {
  const mockAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
  const mockApiUrl = "https://api.stacks.test";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(env, "getEnv").mockImplementation(key => {
      if (key === "API_STACKS_ENDPOINT") return mockApiUrl;
      return "";
    });
    (network as jest.Mock).mockResolvedValue({ data: {} });
  });

  describe("fetchBalances", () => {
    const mockBalanceResponse = {
      balance: "1000000",
      locked: "0",
      unlock_height: 0,
      nonce: 5,
    };

    it("should fetch STX balance for an address", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockBalanceResponse });

      const result = await fetchBalances(mockAddress);

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended/v1/address/${mockAddress}/stx`,
      });
      expect(result).toEqual(mockBalanceResponse);
    });
  });

  describe("fetchTokenBalancesPage", () => {
    const mockTokenBalancesResponse = {
      limit: 50,
      offset: 0,
      total: 2,
      results: [
        { token: "SP123.TOKEN-A", balance: "10000" },
        { token: "SP456.TOKEN-B", balance: "20000" },
      ],
    };

    it("should fetch a page of token balances", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockTokenBalancesResponse });

      const result = await fetchTokenBalancesPage(mockAddress);

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended/v2/addresses/${mockAddress}/balances/ft?offset=0&limit=50`,
      });
      expect(result).toEqual(mockTokenBalancesResponse);
    });

    it("should handle custom pagination parameters", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockTokenBalancesResponse });

      await fetchTokenBalancesPage(mockAddress, 100, 25);

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended/v2/addresses/${mockAddress}/balances/ft?offset=100&limit=25`,
      });
    });

    it("should return empty results on error", async () => {
      (network as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchTokenBalancesPage(mockAddress);

      expect(result).toEqual({ limit: 50, offset: 0, total: 0, results: [] });
    });
  });

  describe("fetchAllTokenBalances", () => {
    const mockTokenBalancesPage1 = {
      limit: 50,
      offset: 0,
      total: 75,
      results: [
        { token: "SP123.TOKEN-A", balance: "10000" },
        { token: "SP456.TOKEN-B", balance: "20000" },
      ],
    };

    const mockTokenBalancesPage2 = {
      limit: 50,
      offset: 50,
      total: 75,
      results: [{ token: "SP789.TOKEN-C", balance: "30000" }],
    };

    it("should fetch all token balances by paginating", async () => {
      (network as jest.Mock)
        .mockResolvedValueOnce({ data: mockTokenBalancesPage1 })
        .mockResolvedValueOnce({ data: mockTokenBalancesPage2 });

      const result = await fetchAllTokenBalances(mockAddress);

      expect(network).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        "SP123.TOKEN-A": "10000",
        "SP456.TOKEN-B": "20000",
        "SP789.TOKEN-C": "30000",
      });
    });
  });

  describe("fetchEstimatedFees", () => {
    const mockFeeRequest: EstimatedFeesRequest = {
      to: "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      from: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    };
    const mockFeeResponse = { fee: 180 };

    it("should fetch estimated fees for a transfer", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockFeeResponse });

      const result = await fetchEstimatedFees(mockFeeRequest);

      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockApiUrl}/v2/fees/transfer`,
        data: JSON.stringify(mockFeeRequest),
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockFeeResponse);
    });
  });

  describe("fetchBlockHeight", () => {
    const mockNetworkStatusResponse = {
      server_version: "stacks-blockchain-api",
      status: "ready",
      chain_tip: {
        block_height: 12345,
        block_hash: "0xabcdef",
      },
    };

    it("should fetch current blockchain status", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockNetworkStatusResponse });

      const result = await fetchBlockHeight();

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended`,
      });
      expect(result).toEqual(mockNetworkStatusResponse);
    });
  });

  describe("fetchTransactionsPage", () => {
    const mockTransactionsResponse = {
      limit: 50,
      offset: 0,
      total: 2,
      results: [
        { tx_id: "0xabc123", tx_type: "token_transfer" },
        { tx_id: "0xdef456", tx_type: "contract_call" },
      ],
    };

    it("should fetch a page of transactions", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockTransactionsResponse });

      const result = await fetchTransactionsPage(mockAddress);

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended/v2/addresses/${mockAddress}/transactions?offset=0&limit=50`,
      });
      expect(result).toEqual(mockTransactionsResponse);
    });

    it("should handle custom pagination parameters", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockTransactionsResponse });

      await fetchTransactionsPage(mockAddress, 100, 25);

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended/v2/addresses/${mockAddress}/transactions?offset=100&limit=25`,
      });
    });

    it("should return empty results on error", async () => {
      (network as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchTransactionsPage(mockAddress);

      expect(result).toEqual({ limit: 50, offset: 0, total: 0, results: [] });
    });
  });

  describe("fetchAllTransactions", () => {
    it("should fetch all transactions by paginating", async () => {
      const result = await fetchAllTransactions(mockAddress);

      expect(fetchAllTransactions).toHaveBeenCalledWith(mockAddress);
      expect(result).toEqual([
        { tx_id: "0xabc123", tx_type: "token_transfer" },
        { tx_id: "0xdef456", tx_type: "contract_call" },
        { tx_id: "0xghi789", tx_type: "token_transfer" },
      ]);
    });
  });

  describe("fetchFullTxs", () => {
    it("should organize transactions by type", async () => {
      const result = await fetchFullTxs(mockAddress);

      expect(fetchFullTxs).toHaveBeenCalledWith(mockAddress);
      expect(result).toEqual([
        [
          { tx_id: "0xabc123", tx_type: "token_transfer" },
          { tx_id: "0xjkl012", tx_type: "contract_call" },
        ],
        {
          "SP123.CONTRACT-A": [{ tx_id: "0xdef456", tx_type: "contract_call" }],
        },
      ]);
    });
  });

  describe("broadcastTx", () => {
    const mockTxBuffer = Buffer.from("serialized_transaction_data");

    it("should broadcast a transaction", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: "abc123" });

      const result = await broadcastTx(mockTxBuffer);

      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockApiUrl}/v2/transactions`,
        data: mockTxBuffer,
        headers: { "Content-Type": "application/octet-stream" },
      });
      expect(result).toEqual("0xabc123");
    });

    it("should handle empty response", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: "" });

      const result = await broadcastTx(mockTxBuffer);

      expect(result).toEqual("");
    });
  });

  describe("fetchMempoolTransactionsPage", () => {
    const mockMempoolResponse = {
      limit: 50,
      offset: 0,
      total: 2,
      results: [
        { tx_id: "0xabc123", status: "pending" },
        { tx_id: "0xdef456", status: "pending" },
      ],
    };

    it("should fetch a page of mempool transactions", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockMempoolResponse });

      const result = await fetchMempoolTransactionsPage(mockAddress);

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended/v1/tx/mempool?sender_address=${mockAddress}&offset=0&limit=50`,
      });
      expect(result).toEqual(mockMempoolResponse);
    });

    it("should handle custom pagination parameters", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockMempoolResponse });

      await fetchMempoolTransactionsPage(mockAddress, 100, 25);

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended/v1/tx/mempool?sender_address=${mockAddress}&offset=100&limit=25`,
      });
    });
  });

  describe("fetchFullMempoolTxs", () => {
    const mockMempoolPage1 = {
      limit: 50,
      offset: 0,
      total: 75,
      results: [
        { tx_id: "0xabc123", status: "pending" },
        { tx_id: "0xdef456", status: "pending" },
      ],
    };

    const mockMempoolPage2 = {
      limit: 50,
      offset: 50,
      total: 75,
      results: [{ tx_id: "0xghi789", status: "pending" }],
    };

    it("should fetch all mempool transactions by paginating", async () => {
      (network as jest.Mock)
        .mockResolvedValueOnce({ data: mockMempoolPage1 })
        .mockResolvedValueOnce({ data: mockMempoolPage2 });

      const result = await fetchFullMempoolTxs(mockAddress);

      expect(network).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        { tx_id: "0xabc123", status: "pending" },
        { tx_id: "0xdef456", status: "pending" },
        { tx_id: "0xghi789", status: "pending" },
      ]);
    });
  });

  describe("fetchNonce", () => {
    const mockNonceResponse = {
      last_executed_tx_nonce: 4,
      last_mempool_tx_nonce: 5,
      possible_next_nonce: 5,
      detected_missing_nonces: [],
    };

    it("should fetch the nonce for an address", async () => {
      (network as jest.Mock).mockResolvedValueOnce({ data: mockNonceResponse });

      const result = await fetchNonce(mockAddress);

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockApiUrl}/extended/v1/address/${mockAddress}/nonces`,
      });
      expect(result).toEqual(mockNonceResponse);
    });
  });

  describe("API URL handling", () => {
    it("should throw error when API endpoint is not available", async () => {
      jest.spyOn(env, "getEnv").mockReturnValueOnce("");

      await expect(fetchBalances(mockAddress)).rejects.toThrow("API base URL not available");
    });
  });
});
