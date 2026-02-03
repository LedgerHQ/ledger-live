import network from "@ledgerhq/live-network";
import aleoConfig from "../config";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { PROGRAM_ID } from "../constants";
import { apiClient } from "./api";

jest.mock("@ledgerhq/live-network");
jest.mock("../config");

const mockNetwork = network as jest.MockedFunction<typeof network>;
const mockGetCoinConfig = aleoConfig.getCoinConfig as jest.MockedFunction<
  typeof aleoConfig.getCoinConfig
>;

describe("apiClient", () => {
  const mockCurrency = getMockedCurrency();
  const mockConfig = getMockedConfig();
  const mockNodeUrl = mockConfig.nodeUrl;
  const mockAddress = "aleo14pfq40wgltv8wrhsxqe5tlme4pkp448rfejfvqhd4yj0qycs7c9s2xkcwv";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue(mockConfig);
  });

  describe("getLatestBlock", () => {
    it("should fetch latest block successfully", async () => {
      const mockBlock = {
        block_hash: "ab1234567890",
        previous_hash: "ab0987654321",
        header: {
          metadata: {
            height: 1234567,
            timestamp: 1234567890,
          },
        },
      };

      mockNetwork.mockResolvedValue({ data: mockBlock, status: 200 });

      const result = await apiClient.getLatestBlock(mockCurrency);
      const requestUrl = mockNetwork.mock.calls[0][0].url;

      expect(result).toEqual(mockBlock);
      expect(mockGetCoinConfig).toHaveBeenCalledTimes(1);
      expect(mockGetCoinConfig).toHaveBeenCalledWith(mockCurrency);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
      expect(requestUrl).toBe(`${mockNodeUrl}/blocks/latest`);
    });

    it("should throw error when network request fails", async () => {
      const mockError = new Error("Network error");
      mockNetwork.mockRejectedValue(mockError);

      await expect(apiClient.getLatestBlock(mockCurrency)).rejects.toThrow("Network error");
    });
  });

  describe("getAccountBalance", () => {
    it("should fetch account balance successfully", async () => {
      const mockBalance = "1000000u64";
      mockNetwork.mockResolvedValue({ data: mockBalance, status: 200 });

      const result = await apiClient.getAccountBalance(mockCurrency, mockAddress);
      const requestUrl = mockNetwork.mock.calls[0][0].url;

      expect(result).toBe(mockBalance);
      expect(mockGetCoinConfig).toHaveBeenCalledTimes(1);
      expect(mockGetCoinConfig).toHaveBeenCalledWith(mockCurrency);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
      expect(requestUrl).toBe(
        `${mockNodeUrl}/programs/program/${PROGRAM_ID.CREDITS}/mapping/account/${mockAddress}`,
      );
    });

    it("should handle zero balance", async () => {
      const mockBalance = "0u64";
      mockNetwork.mockResolvedValue({ data: mockBalance, status: 200 });

      const result = await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(result).toBe(mockBalance);
    });

    it("should handle large balance values", async () => {
      const mockBalance = "999999999999999999u64";
      mockNetwork.mockResolvedValue({ data: mockBalance, status: 200 });

      const result = await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(result).toBe(mockBalance);
    });

    it("should throw error when network request fails", async () => {
      const mockError = new Error("Network error");
      mockNetwork.mockRejectedValue(mockError);

      await expect(apiClient.getAccountBalance(mockCurrency, mockAddress)).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("getTransactionById", () => {
    it("should fetch transaction details by id successfully", async () => {
      const mockTransactionId = "at1abc123def456";
      const mockTransactionDetails = {
        transaction_id: mockTransactionId,
        type: "execute",
        status: "accepted",
        block_number: 1234567,
        timestamp: 1234567890,
        transitions: [],
      };

      mockNetwork.mockResolvedValue({ data: mockTransactionDetails, status: 200 });

      const result = await apiClient.getTransactionById(mockCurrency, mockTransactionId);
      const requestUrl = mockNetwork.mock.calls[0][0].url;

      expect(result).toEqual(mockTransactionDetails);
      expect(mockGetCoinConfig).toHaveBeenCalledTimes(1);
      expect(mockGetCoinConfig).toHaveBeenCalledWith(mockCurrency);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
      expect(requestUrl).toBe(`${mockNodeUrl}/transactions/${mockTransactionId}`);
    });

    it("should throw error when network request fails", async () => {
      const mockTransactionId = "at1abc123def456";
      const mockError = new Error("Network error");
      mockNetwork.mockRejectedValue(mockError);

      await expect(apiClient.getTransactionById(mockCurrency, mockTransactionId)).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("getAccountPublicTransactions", () => {
    const mockTx1 = { id: "tx1", block_number: 100 };
    const mockTx2 = { id: "tx2", block_number: 101 };

    it("should fetch transactions with default parameters", async () => {
      mockNetwork.mockResolvedValue({
        data: { transactions: [mockTx1, mockTx2], next_cursor: null },
        status: 200,
      });

      const params = {
        cursor: mockTx1.block_number.toString(),
        currency: mockCurrency,
        address: mockAddress,
        minHeight: 0,
      } as const;

      const result = await apiClient.getAccountPublicTransactions(params);
      const requestUrl = mockNetwork.mock.calls[0][0].url;

      expect(result.transactions).toEqual([mockTx1, mockTx2]);
      expect(mockGetCoinConfig).toHaveBeenCalledTimes(1);
      expect(mockGetCoinConfig).toHaveBeenCalledWith(mockCurrency);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
      expect(requestUrl).toContain(`${mockNodeUrl}/transactions/address/${mockAddress}`);
      expect(requestUrl).toContain("limit=50");
      expect(requestUrl).toContain("sort=asc");
      expect(requestUrl).toContain("direction=next");
      expect(requestUrl).toContain(`cursor_block_number=${params.cursor}`);
    });

    it("should use cursor when provided", async () => {
      const cursor = mockTx1.block_number.toString();
      mockNetwork.mockResolvedValue({
        data: { transactions: [mockTx2], next_cursor: null },
        status: 200,
      });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        cursor,
        limit: 2,
      });

      const requestUrl = mockNetwork.mock.calls[0][0].url;

      expect(requestUrl).toContain(`cursor_block_number=${cursor}`);
    });

    it("should apply custom order parameter", async () => {
      mockNetwork.mockResolvedValue({
        data: { transactions: [mockTx1], next_cursor: null },
        status: 200,
      });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        limit: 2,
        order: "desc",
      });

      const requestUrl = mockNetwork.mock.calls[0][0].url;

      expect(requestUrl).toContain("sort=desc");
    });

    it("should throw error on network failure", async () => {
      mockNetwork.mockRejectedValue(new Error("Network error"));

      await expect(
        apiClient.getAccountPublicTransactions({
          currency: mockCurrency,
          address: mockAddress,
          limit: 2,
        }),
      ).rejects.toThrow("Network error");
    });
  });
});
