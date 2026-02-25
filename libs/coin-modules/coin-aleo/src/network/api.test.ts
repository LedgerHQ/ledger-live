import network from "@ledgerhq/live-network";
import { getNetworkConfig } from "../logic/utils";
import type { AleoLatestBlockResponse } from "../types/api";
import { testnetPrivateRecord } from "../__tests__/fixtures/api.fixture";
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
      jest.mocked(network).mockRejectedValue(new Error("Network error"));

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
      jest.mocked(network).mockRejectedValue(new Error("Transaction not found"));

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
      jest.mocked(network).mockRejectedValue(new Error("Network error"));

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

  describe("getAccountBalance", () => {
    const mockAddress = "aleo1test123address456";

    it("should fetch the account balance successfully", async () => {
      const mockBalance = "1000000u64";
      jest.mocked(network).mockResolvedValue({ data: mockBalance });

      const result = await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.aleo.network/v2/mainnet/program/credits.aleo/mapping/account/${mockAddress}`,
      });
      expect(result).toEqual(mockBalance);
    });

    it("should return null when account has no balance", async () => {
      jest.mocked(network).mockResolvedValue({ data: null });

      const result = await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(result).toBeNull();
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Network error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(apiClient.getAccountBalance(mockCurrency, mockAddress)).rejects.toThrow(
        "Network error",
      );
    });

    it("should use correct network configuration for testnet", async () => {
      const testnetConfig = {
        nodeUrl: "https://api.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);
      jest.mocked(network).mockResolvedValue({ data: "500000u64" });

      await apiClient.getAccountBalance(mockCurrency, mockAddress);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `https://api.testnet.aleo.network/v2/testnet/program/credits.aleo/mapping/account/${mockAddress}`,
      });
    });
  });

  describe("registerNewAccount", () => {
    const mockUsername = "test-consumer";

    it("should register a new account successfully", async () => {
      const mockResponse = {
        consumer: { id: "consumer-uuid-123" },
        created_at: 1700000000,
        id: "account-uuid-456",
        key: "api-key-789",
      };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.registerNewAccount(mockCurrency, mockUsername);

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.aleo.network/consumers",
        data: { username: mockUsername },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error when registration fails", async () => {
      const mockError = new Error("Registration failed");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(apiClient.registerNewAccount(mockCurrency, mockUsername)).rejects.toThrow(
        "Registration failed",
      );
    });
  });

  describe("getAccountJWT", () => {
    const mockApiKey = "test-api-key";
    const mockConsumerId = "consumer-uuid-123";

    it("should fetch a JWT successfully", async () => {
      const mockExp = 1700100000;
      const mockToken = "Bearer eyJhbGciOiJIUzI1NiJ9.test";

      jest.mocked(network).mockResolvedValue({
        data: { exp: mockExp },
        headers: { authorization: mockToken },
      });

      const result = await apiClient.getAccountJWT(mockCurrency, mockApiKey, mockConsumerId);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `https://api.provable.com/jwts/${mockConsumerId}`,
        headers: { "X-Provable-API-Key": mockApiKey },
      });
      expect(result).toEqual({ token: mockToken, exp: mockExp });
    });

    it("should return empty token when authorization header is missing", async () => {
      jest.mocked(network).mockResolvedValue({
        data: { exp: 1700100000 },
        headers: {},
      });

      const result = await apiClient.getAccountJWT(mockCurrency, mockApiKey, mockConsumerId);

      expect(result.token).toBe("");
    });

    it("should return empty token when headers are absent", async () => {
      jest.mocked(network).mockResolvedValue({
        data: { exp: 1700100000 },
      });

      const result = await apiClient.getAccountJWT(mockCurrency, mockApiKey, mockConsumerId);

      expect(result.token).toBe("");
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Unauthorized");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.getAccountJWT(mockCurrency, mockApiKey, mockConsumerId),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("getPublicKey", () => {
    const mockJwt = "Bearer eyJhbGciOiJIUzI1NiJ9.test";

    it("should fetch the public key successfully", async () => {
      const mockResponse = {
        key_id: "key-id-123",
        public_key: "pubkey-abc-456",
      };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getPublicKey(mockCurrency, mockJwt);

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: "https://api.provable.com/scanner/mainnet/pubkey",
        headers: { Authorization: mockJwt },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should use the correct network type in the URL", async () => {
      const testnetConfig = {
        nodeUrl: "https://api.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);
      jest.mocked(network).mockResolvedValue({ data: { key_id: "k1", public_key: "pk1" } });

      await apiClient.getPublicKey(mockCurrency, mockJwt);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: "https://api.provable.com/scanner/testnet/pubkey",
        headers: { Authorization: mockJwt },
      });
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Forbidden");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(apiClient.getPublicKey(mockCurrency, mockJwt)).rejects.toThrow("Forbidden");
    });
  });

  describe("registerForScanningAccountRecordsEncrypted", () => {
    const mockJwt = "Bearer eyJhbGciOiJIUzI1NiJ9.test";
    const mockEncryptedData = "encrypted-ciphertext-xyz";
    const mockKeyId = "key-id-123";

    it("should register for encrypted record scanning successfully", async () => {
      const mockResponse = { uuid: "scan-uuid-789" };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.registerForScanningAccountRecordsEncrypted({
        currency: mockCurrency,
        jwt: mockJwt,
        encryptedData: mockEncryptedData,
        keyId: mockKeyId,
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.aleo.network/scanner/mainnet/register/encrypted",
        headers: { Authorization: mockJwt },
        data: { key_id: mockKeyId, ciphertext: mockEncryptedData },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should use the correct network type in the URL", async () => {
      const testnetConfig = {
        nodeUrl: "https://api.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);
      jest.mocked(network).mockResolvedValue({ data: { uuid: "scan-uuid-testnet" } });

      await apiClient.registerForScanningAccountRecordsEncrypted({
        currency: mockCurrency,
        jwt: mockJwt,
        encryptedData: mockEncryptedData,
        keyId: mockKeyId,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.testnet.aleo.network/scanner/testnet/register/encrypted",
        headers: { Authorization: mockJwt },
        data: { key_id: mockKeyId, ciphertext: mockEncryptedData },
      });
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Registration error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.registerForScanningAccountRecordsEncrypted({
          currency: mockCurrency,
          jwt: mockJwt,
          encryptedData: mockEncryptedData,
          keyId: mockKeyId,
        }),
      ).rejects.toThrow("Registration error");
    });
  });

  describe("getRecordScannerStatus", () => {
    const mockAccessToken = "Bearer eyJhbGciOiJIUzI1NiJ9.test";
    const mockUuid = "scan-uuid-789";

    it("should fetch the record scanner status successfully", async () => {
      const mockResponse = { synced: true, percentage: 100 };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getRecordScannerStatus(
        mockCurrency,
        mockAccessToken,
        mockUuid,
      );

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.aleo.network/scanner/mainnet/status",
        headers: { Authorization: mockAccessToken, "Content-Type": "application/json" },
        data: `"${mockUuid}"`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should return partial sync status", async () => {
      const mockResponse = { synced: false, percentage: 42 };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getRecordScannerStatus(
        mockCurrency,
        mockAccessToken,
        mockUuid,
      );

      expect(result.synced).toBe(false);
      expect(result.percentage).toBe(42);
    });

    it("should use the correct network type in the URL", async () => {
      const testnetConfig = {
        nodeUrl: "https://api.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);
      jest.mocked(network).mockResolvedValue({ data: { synced: true, percentage: 100 } });

      await apiClient.getRecordScannerStatus(mockCurrency, mockAccessToken, mockUuid);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.testnet.aleo.network/scanner/testnet/status",
        headers: { Authorization: mockAccessToken, "Content-Type": "application/json" },
        data: `"${mockUuid}"`,
      });
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Status fetch failed");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.getRecordScannerStatus(mockCurrency, mockAccessToken, mockUuid),
      ).rejects.toThrow("Status fetch failed");
    });
  });

  describe("getAccountOwnedRecords", () => {
    const mockJwtToken = "Bearer eyJhbGciOiJIUzI1NiJ9.test";
    const mockApiKey = "test-api-key-123";
    const mockUuid = "scan-uuid-abc-789";

    it("should fetch owned records successfully", async () => {
      const mockResponse = [testnetPrivateRecord];
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.aleo.network/scanner/mainnet/records/owned",
        headers: {
          Authorization: mockJwtToken,
          "X-Provable-API-Key": mockApiKey,
        },
        data: { uuid: mockUuid },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should include `unspent: true` in the request body when unspent is true", async () => {
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord] });

      await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
        unspent: true,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { unspent: true, uuid: mockUuid },
        }),
      );
    });

    it("should include `unspent: false` in the request body when unspent is false", async () => {
      jest.mocked(network).mockResolvedValue({ data: [] });

      await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
        unspent: false,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { unspent: false, uuid: mockUuid },
        }),
      );
    });

    it("should omit `unspent` from the request body when not provided", async () => {
      jest.mocked(network).mockResolvedValue({ data: [] });

      await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
      });

      const callData = jest.mocked(network).mock.calls[0][0].data as Record<string, unknown>;
      expect(callData).not.toHaveProperty("unspent");
    });

    it("should include `filter.start` in the request body when start is provided", async () => {
      const mockStart = 14192648;
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord] });

      await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
        start: mockStart,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { filter: { start: mockStart }, uuid: mockUuid },
        }),
      );
    });

    it("should omit `filter` from the request body when start is not provided", async () => {
      jest.mocked(network).mockResolvedValue({ data: [] });

      await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
      });

      const callData = jest.mocked(network).mock.calls[0][0].data as Record<string, unknown>;
      expect(callData).not.toHaveProperty("filter");
    });

    it("should include both `unspent` and `filter.start` when both are provided", async () => {
      const mockStart = 14192648;
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord] });

      await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
        unspent: true,
        start: mockStart,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { unspent: true, filter: { start: mockStart }, uuid: mockUuid },
        }),
      );
    });

    it("should return an empty array when no records are found", async () => {
      jest.mocked(network).mockResolvedValue({ data: [] });

      const result = await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
      });

      expect(result).toEqual([]);
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Unauthorized");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.getAccountOwnedRecords({
          currency: mockCurrency,
          jwtToken: mockJwtToken,
          apiKey: mockApiKey,
          uuid: mockUuid,
        }),
      ).rejects.toThrow("Unauthorized");
    });

    it("should use the correct network type in the URL for testnet", async () => {
      const testnetConfig = {
        nodeUrl: "https://api.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);
      jest.mocked(network).mockResolvedValue({ data: [] });

      await apiClient.getAccountOwnedRecords({
        currency: mockCurrency,
        jwtToken: mockJwtToken,
        apiKey: mockApiKey,
        uuid: mockUuid,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: "https://api.testnet.aleo.network/scanner/testnet/records/owned",
        }),
      );
    });
  });
});
