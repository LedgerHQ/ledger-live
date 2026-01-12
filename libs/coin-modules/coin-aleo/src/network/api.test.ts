import network from "@ledgerhq/live-network";
import aleoConfig from "../config";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
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
  const mockAddress = "aleo14pfq40wgltv8wrhsxqe5tlme4pkp448rfejfvqhd4yj0qycs7c9s2xkcwv";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue(mockConfig);
  });

  describe("getAccountBalance", () => {
    it("should fetch account balance successfully", async () => {
      const mockBalance = "1000000u64";
      mockNetwork.mockResolvedValue({ data: mockBalance, status: 200 });

      const result = await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(result).toBe(mockBalance);
      expect(mockGetCoinConfig).toHaveBeenCalledTimes(1);
      expect(mockGetCoinConfig).toHaveBeenCalledWith(mockCurrency);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
      expect(mockNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockConfig.nodeUrl}/programs/program/credits.aleo/mapping/account/${mockAddress}`,
      });
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

    it("should use correct node URL from config", async () => {
      const customNodeUrl = "https://custom.aleo.node";
      mockGetCoinConfig.mockReturnValue({ ...mockConfig, nodeUrl: customNodeUrl });
      mockNetwork.mockResolvedValue({ data: "1000000u64", status: 200 });

      await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(mockNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: `${customNodeUrl}/programs/program/credits.aleo/mapping/account/${mockAddress}`,
      });
    });
  });
});
