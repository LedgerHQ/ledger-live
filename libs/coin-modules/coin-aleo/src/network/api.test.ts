import network from "@ledgerhq/live-network";
import { getNetworkConfig } from "../logic/utils";
import type { AleoLatestBlockResponse } from "../types/api";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import {
  getMockedTransactionDetails,
  getMockedSimpleTransactionDetails,
  getMockedAccountPublicTransactions,
} from "../__tests__/fixtures/transaction.fixture";
import { apiClient } from "./api";

jest.mock("@ledgerhq/live-network");
jest.mock("../logic/utils");

describe("apiClient", () => {
  const mockCurrency = getMockedCurrency();
  const mockNetworkConfig = {
    nodeUrl: "https://api.aleo.network",
    networkType: "mainnet",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getNetworkConfig).mockReturnValue(mockNetworkConfig);
  });

  describe("getLatestBlock", () => {
    it("should fetch the latest block successfully", async () => {
      const mockResponse: AleoLatestBlockResponse = {
        block_hash: "ab1234567890",
        previous_hash: "ab0987654321",
        header: {
          metadata: {
            height: 1234567,
            timestamp: new Date("2024-01-01T00:00:00.000Z").getTime() / 1000,
          },
        },
      };

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getLatestBlock(mockCurrency);

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: "https://api.aleo.network/v2/mainnet/blocks/latest",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Network error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(apiClient.getLatestBlock(mockCurrency)).rejects.toThrow("Network error");
    });

    it("should use correct network configuration", async () => {
      const testnetConfig = {
        nodeUrl: "https://api.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);

      const mockResponse: AleoLatestBlockResponse = {
        block_hash: "test123",
        previous_hash: "test456",
        header: {
          metadata: {
            height: 1234567,
            timestamp: new Date("2024-01-01T00:00:00.000Z").getTime() / 1000,
          },
        },
      };

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await apiClient.getLatestBlock(mockCurrency);

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: "https://api.testnet.aleo.network/v2/testnet/blocks/latest",
      });
    });
  });

  describe("getTransactionById", () => {
    it("should fetch transaction by ID successfully", async () => {
      const mockTransactionId = "at1abc123def456";
      const mockResponse = getMockedTransactionDetails(mockTransactionId);

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getTransactionById(mockCurrency, mockTransactionId);

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.aleo.network/v2/mainnet/transactions/${mockTransactionId}`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error when transaction is not found", async () => {
      const mockError = new Error("Transaction not found");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(apiClient.getTransactionById(mockCurrency, "at1nonexistent")).rejects.toThrow(
        "Transaction not found",
      );
    });

    it("should use correct network configuration for testnet", async () => {
      const testnetConfig = {
        nodeUrl: "https://api.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);

      const mockTransactionId = "at1testnet123";
      const mockResponse = getMockedSimpleTransactionDetails(mockTransactionId, {
        block_height: 100,
        block_timestamp: "2024-01-01T00:00:00Z",
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await apiClient.getTransactionById(mockCurrency, mockTransactionId);

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.testnet.aleo.network/v2/testnet/transactions/${mockTransactionId}`,
      });
    });
  });

  describe("getAccountPublicTransactions", () => {
    const mockAddress = "aleo1test123address456";

    it("should fetch account transactions with default parameters", async () => {
      const mockResponse = getMockedAccountPublicTransactions(mockAddress);

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.aleo.network/v2/mainnet/transactions/address/${mockAddress}?limit=50&sort=asc&direction=next`,
      });
      expect(result).toEqual(mockResponse);
      expect(result.transactions).toHaveLength(2);
    });

    it("should fetch transactions with custom limit", async () => {
      const customLimit = 10;
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
        next_cursor: undefined,
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        limit: customLimit,
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.aleo.network/v2/mainnet/transactions/address/${mockAddress}?limit=10&sort=asc&direction=next`,
      });
    });

    it("should fetch transactions with descending order", async () => {
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
        next_cursor: undefined,
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        order: "desc",
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.aleo.network/v2/mainnet/transactions/address/${mockAddress}?limit=50&sort=desc&direction=next`,
      });
    });

    it("should fetch transactions with cursor for pagination", async () => {
      const cursor = "123456";
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
        prev_cursor: {
          block_number: 123450,
          transition_id: "au1prev",
        },
        next_cursor: {
          block_number: 123500,
          transition_id: "au1next",
        },
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        cursor,
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.aleo.network/v2/mainnet/transactions/address/${mockAddress}?limit=50&sort=asc&direction=next&cursor_block_number=${cursor}`,
      });
    });

    it("should fetch previous page with direction=prev", async () => {
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
        next_cursor: undefined,
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        direction: "prev",
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.aleo.network/v2/mainnet/transactions/address/${mockAddress}?limit=50&sort=asc&direction=prev`,
      });
    });

    it("should fetch transactions with all custom parameters", async () => {
      const cursor = "999999";
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [
          {
            transaction_id: "at1custom",
            transition_id: "au1custom",
            transaction_status: "accepted",
            block_number: 999999,
            block_timestamp: "2024-03-01T12:00:00Z",
            function_id: "transfer_public",
            amount: 75000000,
            sender_address: mockAddress,
            recipient_address: "aleo1recipient789",
            program_id: "credits.aleo",
          },
        ],
        next_cursor: undefined,
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        cursor,
        limit: 20,
        order: "desc",
        direction: "prev",
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.aleo.network/v2/mainnet/transactions/address/${mockAddress}?limit=20&sort=desc&direction=prev&cursor_block_number=${cursor}`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Network error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.getAccountPublicTransactions({
          currency: mockCurrency,
          address: mockAddress,
        }),
      ).rejects.toThrow("Network error");
    });

    it("should handle empty transaction list", async () => {
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
        next_cursor: undefined,
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
      });

      expect(result.transactions).toEqual([]);
    });

    it("should use correct network configuration for testnet", async () => {
      const testnetConfig = {
        nodeUrl: "https://api.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);

      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
        next_cursor: undefined,
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.testnet.aleo.network/v2/testnet/transactions/address/${mockAddress}?limit=50&sort=asc&direction=next`,
      });
    });
  });
});
