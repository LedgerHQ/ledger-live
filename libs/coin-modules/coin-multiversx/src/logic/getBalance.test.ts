import { getBalance } from "./getBalance";
import type MultiversXApiClient from "../api/apiCalls";
import type { ESDTToken } from "../types";

// Create a mock API client for testing without importing the real implementation
function createMockApiClient() {
  return {
    getAccountDetails: jest.fn(),
    getESDTTokensForAddress: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<MultiversXApiClient>;
}

describe("getBalance", () => {
  let mockApi: jest.Mocked<MultiversXApiClient>;
  const validAddress = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi = createMockApiClient();
  });

  describe("native EGLD balance", () => {
    it("returns native EGLD balance for funded account", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "1500000000000000000",
        nonce: 5,
        isGuarded: false,
      });

      const result = await getBalance(mockApi, validAddress);

      expect(result[0]).toEqual({
        value: 1500000000000000000n,
        asset: { type: "native" },
      });
      expect(mockApi.getAccountDetails).toHaveBeenCalledWith(validAddress);
    });

    it("returns zero balance for empty account (not empty array)", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "0",
        nonce: 0,
        isGuarded: false,
      });

      const result = await getBalance(mockApi, validAddress);

      // CRITICAL: Array must never be empty per FR4
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toEqual({
        value: 0n,
        asset: { type: "native" },
      });
    });

    it("always returns array with at least one element (FR4 compliance)", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "0",
        nonce: 0,
        isGuarded: false,
      });

      const result = await getBalance(mockApi, validAddress);

      // FR4 compliance check - never return empty array
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("ESDT token balances (Story 1.3)", () => {
    it("returns native EGLD balance AND all ESDT token balances (AC1)", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "1000000000000000000",
        nonce: 10,
        isGuarded: false,
      });

      const mockTokens: ESDTToken[] = [
        { identifier: "USDC-c76f1f", name: "WrappedUSDC", balance: "5000000" },
        { identifier: "MEX-455c57", name: "MEX", balance: "10000000000000000000" },
      ];
      mockApi.getESDTTokensForAddress.mockResolvedValue(mockTokens);

      const result = await getBalance(mockApi, validAddress);

      expect(result).toHaveLength(3);
      // Native balance first
      expect(result[0]).toEqual({
        value: 1000000000000000000n,
        asset: { type: "native" },
      });
      // ESDT tokens follow
      expect(result[1]).toEqual({
        value: 5000000n,
        asset: { type: "esdt", assetReference: "USDC-c76f1f", name: "WrappedUSDC" },
      });
      expect(result[2]).toEqual({
        value: 10000000000000000000n,
        asset: { type: "esdt", assetReference: "MEX-455c57", name: "MEX" },
      });
    });

    it("each ESDT balance has asset.type === 'esdt' and assetReference containing token identifier (AC1)", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "500000000000000000",
        nonce: 3,
        isGuarded: false,
      });

      const mockTokens: ESDTToken[] = [
        { identifier: "WEGLD-bd4d79", name: "WrappedEGLD", balance: "100000000000000000" },
      ];
      mockApi.getESDTTokensForAddress.mockResolvedValue(mockTokens);

      const result = await getBalance(mockApi, validAddress);

      const esdtBalance = result[1];
      expect(esdtBalance.asset).toHaveProperty("type", "esdt");
      expect(esdtBalance.asset).toHaveProperty("assetReference", "WEGLD-bd4d79");
    });

    it("returns only native balance when no ESDT tokens exist (AC2)", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "2000000000000000000",
        nonce: 5,
        isGuarded: false,
      });
      mockApi.getESDTTokensForAddress.mockResolvedValue([]);

      const result = await getBalance(mockApi, validAddress);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        value: 2000000000000000000n,
        asset: { type: "native" },
      });
    });

    it("returns native balance as 0n AND all ESDT token balances when zero EGLD (AC3)", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "0",
        nonce: 2,
        isGuarded: false,
      });

      const mockTokens: ESDTToken[] = [
        { identifier: "RIDE-7d18e9", name: "holoride", balance: "1000000000000000000" },
        { identifier: "UTK-2f80e9", name: "Utrust", balance: "500000000000000000" },
      ];
      mockApi.getESDTTokensForAddress.mockResolvedValue(mockTokens);

      const result = await getBalance(mockApi, validAddress);

      expect(result).toHaveLength(3);
      // Native balance is 0n
      expect(result[0]).toEqual({
        value: 0n,
        asset: { type: "native" },
      });
      // ESDT tokens are present
      expect(result[1]).toEqual({
        value: 1000000000000000000n,
        asset: { type: "esdt", assetReference: "RIDE-7d18e9", name: "holoride" },
      });
      expect(result[2]).toEqual({
        value: 500000000000000000n,
        asset: { type: "esdt", assetReference: "UTK-2f80e9", name: "Utrust" },
      });
    });

    it("native balance is always first in the array", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "100000000000000000",
        nonce: 1,
        isGuarded: false,
      });

      const mockTokens: ESDTToken[] = [
        { identifier: "TOKEN1-aaaaaa", name: "Token1", balance: "1000" },
        { identifier: "TOKEN2-bbbbbb", name: "Token2", balance: "2000" },
        { identifier: "TOKEN3-cccccc", name: "Token3", balance: "3000" },
      ];
      mockApi.getESDTTokensForAddress.mockResolvedValue(mockTokens);

      const result = await getBalance(mockApi, validAddress);

      // First element must be native
      expect(result[0].asset).toEqual({ type: "native" });
      // All subsequent elements are ESDT
      for (let i = 1; i < result.length; i++) {
        expect(result[i].asset).toHaveProperty("type", "esdt");
      }
    });

    it("calls getESDTTokensForAddress with correct address", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "0",
        nonce: 0,
        isGuarded: false,
      });

      await getBalance(mockApi, validAddress);

      expect(mockApi.getESDTTokensForAddress).toHaveBeenCalledWith(validAddress);
    });
  });

  describe("error handling", () => {
    it("throws error for invalid address and does not call network", async () => {
      await expect(getBalance(mockApi, "invalid-address")).rejects.toThrow(
        "Invalid MultiversX address: invalid-address",
      );
      expect(mockApi.getAccountDetails).not.toHaveBeenCalled();
      expect(mockApi.getESDTTokensForAddress).not.toHaveBeenCalled();
    });

    it("wraps network errors with descriptive context", async () => {
      const errorMessage = "Account not found";
      mockApi.getAccountDetails.mockRejectedValue(new Error(errorMessage));

      await expect(getBalance(mockApi, validAddress)).rejects.toThrow(
        `Failed to fetch account ${validAddress}: ${errorMessage}`,
      );
    });

    it("covers non-Error thrown values when wrapping failures", async () => {
      mockApi.getAccountDetails.mockRejectedValue("boom");

      await expect(getBalance(mockApi, validAddress)).rejects.toThrow(
        `Failed to fetch account ${validAddress}: boom`,
      );
    });

    it("wraps ESDT fetch errors with descriptive context", async () => {
      mockApi.getAccountDetails.mockResolvedValue({
        balance: "1000000000000000000",
        nonce: 5,
        isGuarded: false,
      });
      mockApi.getESDTTokensForAddress.mockRejectedValue(new Error("Token API unavailable"));

      await expect(getBalance(mockApi, validAddress)).rejects.toThrow(
        `Failed to fetch account ${validAddress}: Token API unavailable`,
      );
    });
  });
});
