import { getSequence } from "./getSequence";
import type MultiversXApiClient from "../api/apiCalls";

describe("getSequence", () => {
  const mockApiClient = {
    getAccountDetails: jest.fn(),
  } as unknown as MultiversXApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("valid addresses", () => {
    it("returns nonce as bigint for address with transaction history", async () => {
      const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      (mockApiClient.getAccountDetails as jest.Mock).mockResolvedValue({
        balance: "1000000000000000000",
        nonce: 42,
        isGuarded: false,
      });

      const result = await getSequence(mockApiClient, testAddress);

      expect(result).toBe(42n);
      expect(typeof result).toBe("bigint");
      expect(mockApiClient.getAccountDetails).toHaveBeenCalledWith(testAddress);
    });

    it("returns 0n for new address with no transactions", async () => {
      const testAddress = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";
      (mockApiClient.getAccountDetails as jest.Mock).mockResolvedValue({
        balance: "0",
        nonce: 0,
        isGuarded: false,
      });

      const result = await getSequence(mockApiClient, testAddress);

      expect(result).toBe(0n);
      expect(typeof result).toBe("bigint");
    });

    it("correctly converts large nonce values to bigint", async () => {
      const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      const largeNonce = 999999999;
      (mockApiClient.getAccountDetails as jest.Mock).mockResolvedValue({
        balance: "1000000000000000000",
        nonce: largeNonce,
        isGuarded: false,
      });

      const result = await getSequence(mockApiClient, testAddress);

      expect(result).toBe(BigInt(largeNonce));
    });
  });

  describe("invalid addresses", () => {
    it("throws descriptive error for invalid address format", async () => {
      const invalidAddress = "invalid-address";

      await expect(getSequence(mockApiClient, invalidAddress)).rejects.toThrow(
        `Invalid MultiversX address: ${invalidAddress}`,
      );
      expect(mockApiClient.getAccountDetails).not.toHaveBeenCalled();
    });

    it("throws descriptive error for empty address", async () => {
      const emptyAddress = "";

      await expect(getSequence(mockApiClient, emptyAddress)).rejects.toThrow(
        `Invalid MultiversX address: ${emptyAddress}`,
      );
      expect(mockApiClient.getAccountDetails).not.toHaveBeenCalled();
    });

    it("throws descriptive error for address with wrong prefix", async () => {
      const wrongPrefixAddress = "eth1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

      await expect(getSequence(mockApiClient, wrongPrefixAddress)).rejects.toThrow(
        `Invalid MultiversX address: ${wrongPrefixAddress}`,
      );
    });
  });

  describe("invalid nonce values", () => {
    it("throws error when nonce is null", async () => {
      const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      (mockApiClient.getAccountDetails as jest.Mock).mockResolvedValue({
        balance: "1000000000000000000",
        nonce: null,
        isGuarded: false,
      });

      await expect(getSequence(mockApiClient, testAddress)).rejects.toThrow(
        `Account nonce is null or undefined for address ${testAddress}`,
      );
    });

    it("throws error when nonce is undefined", async () => {
      const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      (mockApiClient.getAccountDetails as jest.Mock).mockResolvedValue({
        balance: "1000000000000000000",
        nonce: undefined,
        isGuarded: false,
      });

      await expect(getSequence(mockApiClient, testAddress)).rejects.toThrow(
        `Account nonce is null or undefined for address ${testAddress}`,
      );
    });

    it("throws error when nonce is not a number", async () => {
      const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      (mockApiClient.getAccountDetails as jest.Mock).mockResolvedValue({
        balance: "1000000000000000000",
        nonce: "not-a-number",
        isGuarded: false,
      });

      await expect(getSequence(mockApiClient, testAddress)).rejects.toThrow(
        `Account nonce is not a number (got string) for address ${testAddress}`,
      );
    });

    it("throws error when nonce is negative", async () => {
      const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      (mockApiClient.getAccountDetails as jest.Mock).mockResolvedValue({
        balance: "1000000000000000000",
        nonce: -1,
        isGuarded: false,
      });

      await expect(getSequence(mockApiClient, testAddress)).rejects.toThrow(
        `Account nonce cannot be negative (got -1) for address ${testAddress}`,
      );
    });
  });

  describe("network errors", () => {
    it("wraps network errors with descriptive message", async () => {
      const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      const networkError = new Error("Network timeout");
      (mockApiClient.getAccountDetails as jest.Mock).mockRejectedValue(networkError);

      await expect(getSequence(mockApiClient, testAddress)).rejects.toThrow(
        `Failed to fetch account ${testAddress}: Network timeout`,
      );
    });

    it("handles non-Error exceptions", async () => {
      const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      (mockApiClient.getAccountDetails as jest.Mock).mockRejectedValue("String error");

      await expect(getSequence(mockApiClient, testAddress)).rejects.toThrow(
        `Failed to fetch account ${testAddress}: String error`,
      );
    });
  });
});
