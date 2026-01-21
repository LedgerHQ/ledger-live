import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import aleoConfig from "../config";
import { apiClient } from "./api";

jest.mock("@ledgerhq/live-network");
jest.mock("../config");

const mockNetwork = network as jest.MockedFunction<typeof network>;
const mockGetCoinConfig = aleoConfig.getCoinConfig as jest.MockedFunction<
  typeof aleoConfig.getCoinConfig
>;

describe("apiClient", () => {
  const mockCurrency = { id: "aleo" } as CryptoCurrency;
  const mockNodeUrl = "https://api.provable.com/v2/testnet";
  const mockAddress = "aleo14pfq40wgltv8wrhsxqe5tlme4pkp448rfejfvqhd4yj0qycs7c9s2xkcwv";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue({ nodeUrl: mockNodeUrl });
  });

  describe("getAccountBalance", () => {
    it("should fetch account balance successfully", async () => {
      const mockBalance = "1000000u64";
      mockNetwork.mockResolvedValue({ data: mockBalance });

      const result = await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(result).toBe(mockBalance);
      expect(mockGetCoinConfig).toHaveBeenCalledTimes(1);
      expect(mockGetCoinConfig).toHaveBeenCalledWith(mockCurrency);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
      expect(mockNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockNodeUrl}/programs/program/credits.aleo/mapping/account/${mockAddress}`,
      });
    });

    it("should handle zero balance", async () => {
      const mockBalance = "0u64";
      mockNetwork.mockResolvedValue({ data: mockBalance });

      const result = await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(result).toBe(mockBalance);
    });

    it("should handle large balance values", async () => {
      const mockBalance = "999999999999999999u64";
      mockNetwork.mockResolvedValue({ data: mockBalance });

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

  describe("getAccountPublicTransactions", () => {
    const mockTx1 = { id: "tx1", block_number: 100 };
    const mockTx2 = { id: "tx2", block_number: 101 };
    const mockTx3 = { id: "tx3", block_number: 102 };

    it("should fetch transactions with default parameters", async () => {
      mockNetwork.mockResolvedValue({
        data: { transactions: [mockTx1, mockTx2], next_cursor: null },
      });
      const args = {
        minHeight: 100,
        fetchAllPages: false,
        limit: 3,
        currency: mockCurrency,
        address: mockAddress,
      };
      const result = await apiClient.getAccountPublicTransactions(args);

      expect(result.transactions).toEqual([mockTx1, mockTx2]);

      expect(mockGetCoinConfig).toHaveBeenCalledTimes(1);
      expect(mockGetCoinConfig).toHaveBeenCalledWith(mockCurrency);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
      expect(mockNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockNodeUrl}/transactions/address/${mockAddress}?limit=${args.limit}&sort=desc&direction=next&cursor_block_number=${args.minHeight}`,
      });
    });

    it("should handle pagination with fetchAllPages true", async () => {
      mockNetwork
        .mockResolvedValueOnce({
          data: { transactions: [mockTx1, mockTx2], next_cursor: { block_number: 101 } },
        })
        .mockResolvedValueOnce({
          data: { transactions: [mockTx3], next_cursor: null },
        });

      const result = await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        limit: 2,
        minHeight: 0,
        fetchAllPages: true,
        direction: undefined,
        order: undefined,
      });

      expect(result.transactions).toHaveLength(3);
      expect(result.transactions).toEqual([mockTx1, mockTx2, mockTx3]);
      expect(mockNetwork).toHaveBeenCalledTimes(2);
    });

    it("should respect limit when fetchAllPages is false", async () => {
      const transactions = [...Array(50)].map((_, i) => ({
        id: `tx${i}`,
        block_number: i,
      }));

      mockNetwork.mockResolvedValue({
        data: { transactions, next_cursor: { block_number: 60 } },
      });

      const result = await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        limit: 50,
        minHeight: 60,
        fetchAllPages: false,
        direction: undefined,
        order: undefined,
      });

      expect(result.transactions).toHaveLength(50);
    });

    it("should use min height cursor when provided", async () => {
      const minHeight = 0;
      mockNetwork.mockResolvedValue({
        data: { transactions: [mockTx2], next_cursor: null },
      });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        minHeight: 0,
        limit: 2,
        fetchAllPages: true,
        direction: undefined,
        order: undefined,
      });

      expect(mockNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: expect.stringContaining(`cursor_block_number=${minHeight}`),
      });
    });

    it("should apply custom order parameter", async () => {
      mockNetwork.mockResolvedValue({
        data: { transactions: [mockTx1], next_cursor: null },
      });

      await apiClient.getAccountPublicTransactions({
        currency: mockCurrency,
        address: mockAddress,
        minHeight: 0,
        limit: 2,
        fetchAllPages: true,
        direction: undefined,
        order: "asc",
      });

      expect(mockNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: expect.stringContaining("sort=asc"),
      });
    });

    it("should throw error on network failure", async () => {
      mockNetwork.mockRejectedValue(new Error("Network error"));

      await expect(
        apiClient.getAccountPublicTransactions({
          currency: mockCurrency,
          address: mockAddress,
          minHeight: 0,
          limit: 2,
          fetchAllPages: true,
          direction: undefined,
          order: undefined,
        }),
      ).rejects.toThrow("Network error");
    });
  });
});
