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
  const mockNodeUrl = "https://api.provable.com/v2/mainnet";
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

    it("should use correct node URL from config", async () => {
      const customNodeUrl = "https://custom.aleo.node";
      mockGetCoinConfig.mockReturnValue({ nodeUrl: customNodeUrl });
      mockNetwork.mockResolvedValue({ data: "1000000u64" });

      await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(mockNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: `${customNodeUrl}/programs/program/credits.aleo/mapping/account/${mockAddress}`,
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

        const result = await apiClient.getAccountPublicTransactions({
          currency: mockCurrency,
          address: mockAddress,
          pagingToken: null,
          fetchAllPages: false,
        });

        expect(result.transactions).toEqual([mockTx1, mockTx2]);
        expect(mockNetwork).toHaveBeenCalledWith({
          method: "GET",
          url: expect.stringContaining(`${mockNodeUrl}/transactions/address/${mockAddress}`),
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
          pagingToken: null,
          fetchAllPages: true,
        });

        expect(result.transactions).toHaveLength(3);
        expect(result.transactions).toEqual([mockTx1, mockTx2, mockTx3]);
        expect(mockNetwork).toHaveBeenCalledTimes(2);
      });

      it("should respect limit when fetchAllPages is false", async () => {
        const transactions = Array.from({ length: 60 }, (_, i) => ({
          id: `tx${i}`,
          block_number: i,
        }));

        mockNetwork.mockResolvedValue({
          data: { transactions: transactions.slice(0, 60), next_cursor: { block_number: 60 } },
        });

        const result = await apiClient.getAccountPublicTransactions({
          currency: mockCurrency,
          address: mockAddress,
          pagingToken: null,
          limit: 50,
          fetchAllPages: false,
        });

        expect(result.transactions).toHaveLength(50);
        expect(result.nextCursor).toBe("49");
      });

      it("should use pagingToken when provided", async () => {
        mockNetwork.mockResolvedValue({
          data: { transactions: [mockTx2], next_cursor: null },
        });

        await apiClient.getAccountPublicTransactions({
          currency: mockCurrency,
          address: mockAddress,
          pagingToken: "100",
          fetchAllPages: false,
        });

        expect(mockNetwork).toHaveBeenCalledWith({
          method: "GET",
          url: expect.stringContaining("cursor_block_number=100"),
        });
      });

      it("should handle empty transactions list", async () => {
        mockNetwork.mockResolvedValue({
          data: { transactions: [], next_cursor: null },
        });

        const result = await apiClient.getAccountPublicTransactions({
          currency: mockCurrency,
          address: mockAddress,
          pagingToken: null,
          fetchAllPages: false,
        });

        expect(result.transactions).toEqual([]);
        expect(result.nextCursor).toBeNull();
      });

      it("should apply custom order parameter", async () => {
        mockNetwork.mockResolvedValue({
          data: { transactions: [mockTx1], next_cursor: null },
        });

        await apiClient.getAccountPublicTransactions({
          currency: mockCurrency,
          address: mockAddress,
          pagingToken: null,
          order: "asc",
          fetchAllPages: false,
        });

        expect(mockNetwork).toHaveBeenCalledWith({
          method: "GET",
          url: expect.stringContaining("order=asc"),
        });
      });

      it("should throw error on network failure", async () => {
        mockNetwork.mockRejectedValue(new Error("Network error"));

        await expect(
          apiClient.getAccountPublicTransactions({
            currency: mockCurrency,
            address: mockAddress,
            pagingToken: null,
            fetchAllPages: false,
          }),
        ).rejects.toThrow("Network error");
      });
    });
  });
});
