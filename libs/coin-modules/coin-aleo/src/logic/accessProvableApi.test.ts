import { apiClient } from "../network/api";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import type { ProvableApi } from "../types";
import { accessProvableApi } from "./accessProvableApi";
import * as utils from "./utils";

jest.mock("../network/api");
jest.mock("./utils");

const mockRegisterNewAccount = jest.mocked(apiClient.registerNewAccount);
const mockGetAccountJWT = jest.mocked(apiClient.getAccountJWT);
const mockGetRecordScannerStatus = jest.mocked(apiClient.getRecordScannerStatus);
const mockGenerateUniqueUsername = jest.mocked(utils.generateUniqueUsername);
const mockRegisterForScanningAccountRecords = jest.mocked(
  apiClient.registerForScanningAccountRecords,
);

describe("accessProvableApi", () => {
  const mockCurrency = getMockedCurrency();
  const mockViewKey = "AViewKey1mockviewkey";
  const mockAddress = "aleo1test123";
  const mockApiKey = "test-api-key-123";
  const mockConsumerId = "consumer-id-456";
  const mockUUID = "uuid-abc-def";
  const mockUsername = "1234567890_aleo1test123";
  const mockJWT = {
    token: "jwt-token-789",
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour in the future,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateUniqueUsername.mockReturnValue(mockUsername);
  });

  describe("Initial registration flow", () => {
    it("should register a new account when provableApi is null", async () => {
      mockRegisterNewAccount.mockResolvedValue({
        key: mockApiKey,
        consumer: { id: mockConsumerId },
        created_at: Date.now(),
        id: "account-id",
      });
      mockGetAccountJWT.mockResolvedValue(mockJWT);
      mockRegisterForScanningAccountRecords.mockResolvedValue({ uuid: mockUUID });
      mockGetRecordScannerStatus.mockResolvedValue({ synced: false, percentage: 0 });

      const result = await accessProvableApi(mockCurrency, mockViewKey, mockAddress, null);

      expect(mockGenerateUniqueUsername).toHaveBeenCalledTimes(1);
      expect(mockRegisterNewAccount).toHaveBeenCalledTimes(1);
      expect(mockGetAccountJWT).toHaveBeenCalledTimes(1);
      expect(mockRegisterForScanningAccountRecords).toHaveBeenCalledTimes(1);
      expect(mockGetRecordScannerStatus).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: mockJWT,
        uuid: mockUUID,
        scannerStatus: { synced: false, percentage: 0 },
      });
    });

    it("should register a new account when apiKey is missing", async () => {
      const partialProvableApi: ProvableApi = {
        apiKey: undefined,
        consumerId: undefined,
        jwt: mockJWT,
        uuid: mockUUID,
        scannerStatus: { synced: true, percentage: 100 },
      };

      mockRegisterNewAccount.mockResolvedValue({
        key: mockApiKey,
        consumer: { id: mockConsumerId },
        created_at: Date.now(),
        id: "account-id",
      });
      mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        partialProvableApi,
      );

      expect(mockRegisterNewAccount).toHaveBeenCalledWith(mockCurrency, mockUsername);
      expect(result?.apiKey).toBe(mockApiKey);
      expect(result?.consumerId).toBe(mockConsumerId);
    });

    it("should register a new account when consumerId is missing", async () => {
      const partialProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: undefined,
        jwt: mockJWT,
        uuid: mockUUID,
        scannerStatus: { synced: true, percentage: 100 },
      };

      mockRegisterNewAccount.mockResolvedValue({
        key: mockApiKey,
        consumer: { id: mockConsumerId },
        created_at: Date.now(),
        id: "account-id",
      });
      mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        partialProvableApi,
      );

      expect(mockRegisterNewAccount).toHaveBeenCalledWith(mockCurrency, mockUsername);
      expect(result?.consumerId).toBe(mockConsumerId);
    });
  });

  describe("JWT token management", () => {
    it("should refresh JWT when it is expired", async () => {
      const expiredJWT = {
        token: "expired-token",
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
      };

      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: expiredJWT,
        uuid: mockUUID,
        scannerStatus: { synced: true, percentage: 100 },
      };

      mockGetAccountJWT.mockResolvedValue(mockJWT);
      mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(result?.jwt).toEqual(mockJWT);
    });

    it("should refresh JWT when it is about to expire (within 5 minutes)", async () => {
      const soonToExpireJWT = {
        token: "soon-to-expire-token",
        exp: Math.floor(Date.now() / 1000) + 4 * 60, // 4 minutes in the future
      };

      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: soonToExpireJWT,
        uuid: mockUUID,
        scannerStatus: { synced: true, percentage: 100 },
      };

      mockGetAccountJWT.mockResolvedValue(mockJWT);
      mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(mockGetAccountJWT).toHaveBeenCalledWith(mockCurrency, mockApiKey, mockConsumerId);
      expect(result?.jwt).toEqual(mockJWT);
    });

    it("should not refresh JWT when it is still valid", async () => {
      const validJWT = {
        token: "valid-token",
        exp: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes in the future
      };

      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: validJWT,
        uuid: mockUUID,
        scannerStatus: { synced: true, percentage: 100 },
      };

      mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(mockGetAccountJWT).not.toHaveBeenCalled();
      expect(result?.jwt).toEqual(validJWT);
    });

    it("should request new JWT when jwt is undefined", async () => {
      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: undefined,
        uuid: mockUUID,
        scannerStatus: { synced: true, percentage: 100 },
      };

      mockGetAccountJWT.mockResolvedValue(mockJWT);
      mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(mockGetAccountJWT).toHaveBeenCalledWith(mockCurrency, mockApiKey, mockConsumerId);
      expect(result?.jwt).toEqual(mockJWT);
    });

    it("should return null when JWT retrieval fails with Unauthorized error", async () => {
      const expiredJWT = {
        token: "expired-token",
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: expiredJWT,
        uuid: mockUUID,
        scannerStatus: { synced: true, percentage: 100 },
      };

      const unauthorizedError = new Error("Unauthorized");
      mockGetAccountJWT.mockRejectedValue(unauthorizedError);

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(result).toBeNull();
      expect(mockGetAccountJWT).toHaveBeenCalled();
      expect(mockGetRecordScannerStatus).not.toHaveBeenCalled();
    });

    it("should throw error when JWT retrieval fails with non-Unauthorized error", async () => {
      const expiredJWT = {
        token: "expired-token",
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: expiredJWT,
        uuid: mockUUID,
        scannerStatus: { synced: true, percentage: 100 },
      };

      const networkError = new Error("Network error");
      mockGetAccountJWT.mockRejectedValue(networkError);

      await expect(
        accessProvableApi(mockCurrency, mockViewKey, mockAddress, existingProvableApi),
      ).rejects.toThrow("Network error");
    });
  });

  describe("UUID and scanning registration", () => {
    it("should register for scanning when uuid is missing", async () => {
      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: mockJWT,
        uuid: undefined,
        scannerStatus: { synced: false, percentage: 0 },
      };

      mockRegisterForScanningAccountRecords.mockResolvedValue({ uuid: mockUUID });
      mockGetRecordScannerStatus.mockResolvedValue({ synced: false, percentage: 5 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(mockRegisterForScanningAccountRecords).toHaveBeenCalledWith(
        mockCurrency,
        mockJWT.token,
        mockViewKey,
      );
      expect(result?.uuid).toBe(mockUUID);
    });

    it("should not register for scanning when uuid exists", async () => {
      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: mockJWT,
        uuid: mockUUID,
        scannerStatus: { synced: false, percentage: 50 },
      };

      mockGetRecordScannerStatus.mockResolvedValue({ synced: false, percentage: 60 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(mockRegisterForScanningAccountRecords).not.toHaveBeenCalled();
      expect(result?.uuid).toBe(mockUUID);
    });
  });

  describe("Scanner status updates", () => {
    it("should update scanner status when status is available", async () => {
      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: mockJWT,
        uuid: mockUUID,
        scannerStatus: { synced: false, percentage: 50 },
      };

      mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(result?.scannerStatus).toEqual({ synced: true, percentage: 100 });
    });

    it("should preserve previous scanner status when status call returns null", async () => {
      const existingProvableApi: ProvableApi = {
        apiKey: mockApiKey,
        consumerId: mockConsumerId,
        jwt: mockJWT,
        uuid: mockUUID,
        scannerStatus: { synced: false, percentage: 75 },
      };

      mockGetRecordScannerStatus.mockResolvedValue(null as any);

      const result = await accessProvableApi(
        mockCurrency,
        mockViewKey,
        mockAddress,
        existingProvableApi,
      );

      expect(result?.scannerStatus).toEqual({ synced: false, percentage: 75 });
    });

    it("should initialize scanner status with defaults when provableApi is null", async () => {
      mockRegisterNewAccount.mockResolvedValue({
        key: mockApiKey,
        consumer: { id: mockConsumerId },
        created_at: Date.now(),
        id: "account-id",
      });
      mockGetAccountJWT.mockResolvedValue(mockJWT);
      mockRegisterForScanningAccountRecords.mockResolvedValue({ uuid: mockUUID });
      mockGetRecordScannerStatus.mockResolvedValue({ synced: false, percentage: 0 });

      const result = await accessProvableApi(mockCurrency, mockViewKey, mockAddress, null);

      expect(result?.scannerStatus).toEqual({ synced: false, percentage: 0 });
    });
  });
});
