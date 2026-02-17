import network from "@ledgerhq/live-network";
import { getNetworkConfig } from "../logic/utils";
import type { AleoLatestBlockResponse } from "../types/api";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
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

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: "https://api.testnet.aleo.network/v2/testnet/blocks/latest",
      });
    });
  });
});
