import network from "@ledgerhq/live-network";
import { resolveConfig } from "../logic/utils";
import type { AleoLatestBlockResponse } from "../types/api";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  testnetPrivateRecord,
  getMockedTransactionDetails,
  getMockedSimpleTransactionDetails,
  getMockedAccountPublicTransactions,
  getMockedAuthorization,
  getMockedFeeAuthorization,
  getMockedDelegatedProvingResponse,
} from "../__tests__/fixtures/api.fixture";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { apiClient } from "./api";

jest.mock("@ledgerhq/live-network");
jest.mock("../logic/utils");

describe("apiClient", () => {
  const mockCurrency = getMockedCurrency();
  const mockResolvedConfig = getMockedConfig("testnet");
  const customNodeConfig = {
    ...getMockedConfig("testnet"),
    apiUrls: { ...getMockedConfig("testnet").apiUrls, node: "https://custom-node.example.com" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(resolveConfig).mockReturnValue(mockResolvedConfig);
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

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getLatestBlock(mockCurrency.id);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/blocks/latest`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error when network request fails", async () => {
      jest.mocked(network).mockRejectedValue(new Error("Network error"));

      await expect(apiClient.getLatestBlock(mockCurrency.id)).rejects.toThrow("Network error");
    });

    it("should use correct network configuration", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);

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

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      await apiClient.getLatestBlock(mockCurrency.id);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${customNodeConfig.apiUrls.node}/v2/testnet/blocks/latest`,
      });
    });
  });

  describe("getTransactionById", () => {
    it("should fetch transaction by ID successfully", async () => {
      const mockTransactionId = "at1abc123def456";
      const mockResponse = getMockedTransactionDetails(mockTransactionId);

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getTransactionById(mockCurrency.id, mockTransactionId);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/transactions/${mockTransactionId}`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error when transaction is not found", async () => {
      jest.mocked(network).mockRejectedValue(new Error("Transaction not found"));

      await expect(apiClient.getTransactionById(mockCurrency.id, "at1nonexistent")).rejects.toThrow(
        "Transaction not found",
      );
    });

    it("should use correct network configuration for testnet", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);

      const mockTransactionId = "at1testnet123";
      const mockResponse = getMockedSimpleTransactionDetails(mockTransactionId, {
        block_height: 100,
        block_timestamp: "1704067200",
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      await apiClient.getTransactionById(mockCurrency.id, mockTransactionId);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${customNodeConfig.apiUrls.node}/v2/testnet/transactions/${mockTransactionId}`,
      });
    });
  });

  describe("getAccountPublicTransactions", () => {
    const mockAddress = "aleo1test123address456";

    it("should fetch account transactions with default parameters", async () => {
      const mockResponse = getMockedAccountPublicTransactions(mockAddress);

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getAccountPublicTransactions({
        configOrCurrencyId: mockCurrency.id,
        address: mockAddress,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/transactions/address/${mockAddress}?metadata=true&limit=50&sort=asc&direction=next`,
      });
      expect(result).toEqual(mockResponse);
      expect(result.transactions).toHaveLength(2);
    });

    it("should fetch transactions with custom limit", async () => {
      const customLimit = 10;
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      await apiClient.getAccountPublicTransactions({
        configOrCurrencyId: mockCurrency.id,
        address: mockAddress,
        limit: customLimit,
      });
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/transactions/address/${mockAddress}?metadata=true&limit=10&sort=asc&direction=next`,
      });
    });

    it("should fetch transactions with descending order", async () => {
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      await apiClient.getAccountPublicTransactions({
        configOrCurrencyId: mockCurrency.id,
        address: mockAddress,
        order: "desc",
      });
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/transactions/address/${mockAddress}?metadata=true&limit=50&sort=desc&direction=next`,
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

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      await apiClient.getAccountPublicTransactions({
        configOrCurrencyId: mockCurrency.id,
        address: mockAddress,
        cursor,
      });
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/transactions/address/${mockAddress}?metadata=true&limit=50&sort=asc&direction=next&cursor_block_number=${cursor}`,
      });
    });

    it("should fetch previous page with direction=prev", async () => {
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      await apiClient.getAccountPublicTransactions({
        configOrCurrencyId: mockCurrency.id,
        address: mockAddress,
        direction: "prev",
      });
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/transactions/address/${mockAddress}?metadata=true&limit=50&sort=asc&direction=prev`,
      });
    });

    it("should fetch transactions with all custom parameters", async () => {
      const cursor = "999999";
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [
          {
            transaction_id: "at1custom",
            transition_id: "au1custom",
            transaction_status: "Accepted",
            block_number: 999999,
            block_hash: "ab1blockcustom",
            block_timestamp: "1709294400",
            function_id: "transfer_public",
            amount: 75000000,
            fee: 5000000,
            sender_address: mockAddress,
            recipient_address: "aleo1recipient789",
            program_id: "credits.aleo",
          },
        ],
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getAccountPublicTransactions({
        configOrCurrencyId: mockCurrency.id,
        address: mockAddress,
        cursor,
        limit: 20,
        order: "desc",
        direction: "prev",
      });
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/transactions/address/${mockAddress}?metadata=true&limit=20&sort=desc&direction=prev&cursor_block_number=${cursor}`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error when network request fails", async () => {
      jest.mocked(network).mockRejectedValue(new Error("Network error"));

      await expect(
        apiClient.getAccountPublicTransactions({
          configOrCurrencyId: mockCurrency.id,
          address: mockAddress,
        }),
      ).rejects.toThrow("Network error");
    });

    it("should handle empty transaction list", async () => {
      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getAccountPublicTransactions({
        configOrCurrencyId: mockCurrency.id,
        address: mockAddress,
      });

      expect(result.transactions).toEqual([]);
    });

    it("should use correct network configuration for testnet", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);

      const mockResponse = getMockedAccountPublicTransactions(mockAddress, {
        transactions: [],
      });

      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      await apiClient.getAccountPublicTransactions({
        configOrCurrencyId: mockCurrency.id,
        address: mockAddress,
      });
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${customNodeConfig.apiUrls.node}/v2/testnet/transactions/address/${mockAddress}?metadata=true&limit=50&sort=asc&direction=next`,
      });
    });
  });

  describe("getAccountBalance", () => {
    const mockAddress = "aleo1test123address456";

    it("should fetch the account balance successfully", async () => {
      const mockBalance = "1000000u64";
      jest.mocked(network).mockResolvedValue({ data: mockBalance, status: 200 });

      const result = await apiClient.getAccountBalance(mockCurrency.id, mockAddress);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/v2/${mockResolvedConfig.networkType}/program/credits.aleo/mapping/account/${mockAddress}`,
      });
      expect(result).toEqual(mockBalance);
    });

    it("should return null when account has no balance", async () => {
      jest.mocked(network).mockResolvedValue({ data: null, status: 200 });

      const result = await apiClient.getAccountBalance(mockCurrency.id, mockAddress);

      expect(result).toBeNull();
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Network error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(apiClient.getAccountBalance(mockCurrency.id, mockAddress)).rejects.toThrow(
        "Network error",
      );
    });

    it("should use correct network configuration for testnet", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);
      jest.mocked(network).mockResolvedValue({ data: "500000u64", status: 200 });

      await apiClient.getAccountBalance(mockCurrency.id, mockAddress);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${customNodeConfig.apiUrls.node}/v2/testnet/program/credits.aleo/mapping/account/${mockAddress}`,
      });
    });
  });

  describe("getScannerPublicKey", () => {
    it("should fetch the scanner public key successfully", async () => {
      const mockResponse = {
        key_id: "key-id-123",
        public_key: "pubkey-abc-456",
      };
      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getScannerPublicKey(mockCurrency.id);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/scanner/${mockResolvedConfig.networkType}/pubkey`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should use the correct network type in the URL", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);
      jest
        .mocked(network)
        .mockResolvedValue({ data: { key_id: "k1", public_key: "pk1" }, status: 200 });

      await apiClient.getScannerPublicKey(mockCurrency.id);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${customNodeConfig.apiUrls.node}/scanner/testnet/pubkey`,
      });
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Forbidden");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(apiClient.getScannerPublicKey(mockCurrency.id)).rejects.toThrow("Forbidden");
    });
  });

  describe("registerForScanningAccountRecordsEncrypted", () => {
    const mockEncryptedData = "encrypted-ciphertext-xyz";
    const mockKeyId = "key-id-123";

    it("should register for encrypted record scanning successfully", async () => {
      const mockResponse = { uuid: "scan-uuid-789" };
      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.registerForScanningAccountRecordsEncrypted({
        configOrCurrencyId: mockCurrency.id,
        encryptedData: mockEncryptedData,
        keyId: mockKeyId,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockResolvedConfig.apiUrls.node}/scanner/${mockResolvedConfig.networkType}/register/encrypted`,
        data: { key_id: mockKeyId, ciphertext: mockEncryptedData },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should use the correct network type in the URL", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);
      jest.mocked(network).mockResolvedValue({ data: { uuid: "scan-uuid-testnet" }, status: 200 });

      await apiClient.registerForScanningAccountRecordsEncrypted({
        configOrCurrencyId: mockCurrency.id,
        encryptedData: mockEncryptedData,
        keyId: mockKeyId,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${customNodeConfig.apiUrls.node}/scanner/testnet/register/encrypted`,
        data: { key_id: mockKeyId, ciphertext: mockEncryptedData },
      });
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Registration error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.registerForScanningAccountRecordsEncrypted({
          configOrCurrencyId: mockCurrency.id,
          encryptedData: mockEncryptedData,
          keyId: mockKeyId,
        }),
      ).rejects.toThrow("Registration error");
    });
  });

  describe("getRecordScannerStatus", () => {
    const mockUuid = "scan-uuid-789";

    it("should fetch the record scanner status successfully", async () => {
      const mockResponse = { synced: true, percentage: 100 };
      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getRecordScannerStatus(mockCurrency.id, mockUuid);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockResolvedConfig.apiUrls.node}/scanner/${mockResolvedConfig.networkType}/status`,
        headers: { "Content-Type": "application/json" },
        data: `"${mockUuid}"`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should return partial sync status", async () => {
      const mockResponse = { synced: false, percentage: 42 };
      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getRecordScannerStatus(mockCurrency.id, mockUuid);

      expect(result.synced).toBe(false);
      expect(result.percentage).toBe(42);
    });

    it("should use the correct network type in the URL", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);
      jest
        .mocked(network)
        .mockResolvedValue({ data: { synced: true, percentage: 100 }, status: 200 });

      await apiClient.getRecordScannerStatus(mockCurrency.id, mockUuid);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${customNodeConfig.apiUrls.node}/scanner/testnet/status`,
        headers: { "Content-Type": "application/json" },
        data: `"${mockUuid}"`,
      });
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Status fetch failed");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(apiClient.getRecordScannerStatus(mockCurrency.id, mockUuid)).rejects.toThrow(
        "Status fetch failed",
      );
    });
  });

  describe("getAccountOwnedRecords", () => {
    const mockUuid = "scan-uuid-abc-789";

    it("should fetch owned records successfully", async () => {
      const mockResponse = [testnetPrivateRecord];
      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockResolvedConfig.apiUrls.node}/scanner/${mockResolvedConfig.networkType}/records/owned`,
        data: { uuid: mockUuid },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should include `unspent: true` in the request body when unspent is true", async () => {
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
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
      jest.mocked(network).mockResolvedValue({ data: [], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
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
      jest.mocked(network).mockResolvedValue({ data: [], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
      });

      const callData = jest.mocked(network).mock.calls[0][0].data as Record<string, unknown>;
      expect(callData).not.toHaveProperty("unspent");
    });

    it("should include `filter.start` in the request body when start is provided", async () => {
      const mockStart = 14192648;
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
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
      jest.mocked(network).mockResolvedValue({ data: [], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
      });

      const callData = jest.mocked(network).mock.calls[0][0].data as Record<string, unknown>;
      expect(callData).not.toHaveProperty("filter");
    });

    it("should include both `unspent` and `filter.start` when both are provided", async () => {
      const mockStart = 14192648;
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
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
      jest.mocked(network).mockResolvedValue({ data: [], status: 200 });

      const result = await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
      });

      expect(result).toEqual([]);
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Unauthorized");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.getAccountOwnedRecords({
          configOrCurrencyId: mockCurrency.id,
          uuid: mockUuid,
        }),
      ).rejects.toThrow("Unauthorized");
    });

    it("should use the correct network type in the URL for testnet", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);
      jest.mocked(network).mockResolvedValue({ data: [], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${customNodeConfig.apiUrls.node}/scanner/testnet/records/owned`,
        }),
      );
    });

    it("should include `filter.results_per_page` when resultsPerPage is provided", async () => {
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
        resultsPerPage: 100,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { filter: { results_per_page: 100 }, uuid: mockUuid },
        }),
      );
    });

    it("should include `filter.page` when page is provided", async () => {
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
        page: 2,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { filter: { page: 2 }, uuid: mockUuid },
        }),
      );
    });

    it("should include all filter fields when start, resultsPerPage and page are all provided", async () => {
      const mockStart = 14192648;
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
        start: mockStart,
        resultsPerPage: 500,
        page: 3,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            filter: { start: mockStart, results_per_page: 500, page: 3 },
            uuid: mockUuid,
          },
        }),
      );
    });

    it("should combine unspent flag with pagination filter fields", async () => {
      jest.mocked(network).mockResolvedValue({ data: [testnetPrivateRecord], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
        unspent: true,
        resultsPerPage: 200,
        page: 1,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            unspent: true,
            filter: { results_per_page: 200, page: 1 },
            uuid: mockUuid,
          },
        }),
      );
    });

    it("should include `filter.page` in the request body when page is 0", async () => {
      jest.mocked(network).mockResolvedValue({ data: [], status: 200 });

      await apiClient.getAccountOwnedRecords({
        configOrCurrencyId: mockCurrency.id,
        uuid: mockUuid,
        page: 0,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { filter: { page: 0 }, uuid: mockUuid },
        }),
      );
    });
  });

  describe("getProvePublicKey", () => {
    it("should fetch the prove public key successfully", async () => {
      const mockResponse = {
        key_id: "key-id-123",
        public_key: "pubkey-abc-456",
      };
      jest.mocked(network).mockResolvedValue({ data: mockResponse, status: 200 });

      const result = await apiClient.getProvePublicKey({ configOrCurrencyId: mockCurrency.id });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${mockResolvedConfig.apiUrls.node}/prove/${mockResolvedConfig.networkType}/pubkey`,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should use the correct network type in the URL", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);
      jest
        .mocked(network)
        .mockResolvedValue({ data: { key_id: "k1", public_key: "pk1" }, status: 200 });

      await apiClient.getProvePublicKey({ configOrCurrencyId: mockCurrency.id });
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${customNodeConfig.apiUrls.node}/prove/testnet/pubkey`,
      });
    });

    it("should throw an error when network request fails", async () => {
      const mockError = new Error("Forbidden");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.getProvePublicKey({ configOrCurrencyId: mockCurrency.id }),
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("submitDelegatedProvingRequest", () => {
    const mockAuthorization = getMockedAuthorization();
    const mockFeeAuthorization = getMockedFeeAuthorization();
    const mockDelegatedProvingResponse = getMockedDelegatedProvingResponse();

    it("should submit delegated proving request successfully", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockDelegatedProvingResponse, status: 200 });

      const result = await apiClient.submitDelegatedProvingRequest({
        configOrCurrencyId: mockCurrency.id,
        authorization: mockAuthorization,
        feeAuthorization: mockFeeAuthorization,
        broadcast: true,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockResolvedConfig.apiUrls.node}/prove/${mockResolvedConfig.networkType}/prove`,
        data: {
          authorization: mockAuthorization,
          fee_authorization: mockFeeAuthorization,
          broadcast: true,
        },
      });
      expect(result).toEqual(mockDelegatedProvingResponse);
    });

    it("should use correct network URL for testnet", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);
      jest.mocked(network).mockResolvedValue({ data: mockDelegatedProvingResponse, status: 200 });

      await apiClient.submitDelegatedProvingRequest({
        configOrCurrencyId: mockCurrency.id,
        authorization: mockAuthorization,
        feeAuthorization: mockFeeAuthorization,
        broadcast: true,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${customNodeConfig.apiUrls.node}/prove/testnet/prove`,
        }),
      );
    });

    it("should throw error when network request fails", async () => {
      const mockError = new Error("Proving request failed");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.submitDelegatedProvingRequest({
          configOrCurrencyId: mockCurrency.id,
          authorization: mockAuthorization,
          feeAuthorization: mockFeeAuthorization,
          broadcast: true,
        }),
      ).rejects.toThrow("Proving request failed");
    });

    it("should submit without broadcast when broadcast is false", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockDelegatedProvingResponse, status: 200 });

      await apiClient.submitDelegatedProvingRequest({
        configOrCurrencyId: mockCurrency.id,
        authorization: mockAuthorization,
        feeAuthorization: mockFeeAuthorization,
        broadcast: false,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            broadcast: false,
          }),
        }),
      );
    });

    it("should not send fee_authorization when feeAuthorization is not provided", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockDelegatedProvingResponse, status: 200 });

      await apiClient.submitDelegatedProvingRequest({
        configOrCurrencyId: mockCurrency.id,
        authorization: mockAuthorization,
        broadcast: true,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            authorization: mockAuthorization,
            broadcast: true,
          },
        }),
      );
    });
  });

  describe("submitEncryptedDelegatedProvingRequest", () => {
    const mockKeyId = "key-id-123";
    const mockEncryptedData = "encrypted-ciphertext-xyz";
    const mockDelegatedProvingResponse = getMockedDelegatedProvingResponse();

    it("should submit encrypted delegated proving request successfully", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockDelegatedProvingResponse, status: 200 });

      const result = await apiClient.submitEncryptedDelegatedProvingRequest({
        configOrCurrencyId: mockCurrency.id,
        keyId: mockKeyId,
        encryptedData: mockEncryptedData,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockResolvedConfig.apiUrls.node}/prove/${mockResolvedConfig.networkType}/prove/encrypted`,
        data: {
          key_id: mockKeyId,
          ciphertext: mockEncryptedData,
        },
      });
      expect(result).toEqual(mockDelegatedProvingResponse);
    });

    it("should use correct network URL for testnet", async () => {
      jest.mocked(resolveConfig).mockReturnValue(customNodeConfig);
      jest.mocked(network).mockResolvedValue({ data: mockDelegatedProvingResponse, status: 200 });

      await apiClient.submitEncryptedDelegatedProvingRequest({
        configOrCurrencyId: mockCurrency.id,
        keyId: mockKeyId,
        encryptedData: mockEncryptedData,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${customNodeConfig.apiUrls.node}/prove/testnet/prove/encrypted`,
        }),
      );
    });

    it("should throw error when network request fails", async () => {
      const mockError = new Error("Proving request failed");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        apiClient.submitEncryptedDelegatedProvingRequest({
          configOrCurrencyId: mockCurrency.id,
          keyId: mockKeyId,
          encryptedData: mockEncryptedData,
        }),
      ).rejects.toThrow("Proving request failed");
    });
  });
});
