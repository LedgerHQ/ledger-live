import { createCryptoAssetsApi, ApiTokenSchema } from "../api";
import { HttpCacheResult } from "@ledgerhq/live-persistence";
import type { CacheEntry } from "@ledgerhq/live-persistence";

describe("CryptoAssetsApi", () => {
  const baseUrl = "https://api.example.com";
  const mockCacheAdapter = {
    ttl: 24 * 60 * 60,
    refreshTtl: 4 * 60 * 60,
    version: 1,
    get: jest.fn().mockResolvedValue(null as CacheEntry<HttpCacheResult> | null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    cleanupExpired: jest.fn().mockResolvedValue(0),
  };
  const api = createCryptoAssetsApi({
    baseUrl,
    cacheAdapter: mockCacheAdapter,
    clientVersion: "2.130.0",
  });

  describe("API Creation", () => {
    it("should create API with correct reducer path", () => {
      expect(api.reducerPath).toBe("cryptoAssetsApi");
    });

    it("should have all required endpoints", () => {
      expect(api.endpoints.findTokenById).toBeDefined();
      expect(api.endpoints.findTokenByAddressInCurrency).toBeDefined();
    });

    it("should have correct tag types", () => {
      expect(api.endpoints.findTokenById.select).toBeDefined();
      expect(api.endpoints.findTokenByAddressInCurrency.select).toBeDefined();
    });
  });

  describe("Endpoint Configuration", () => {
    it("should configure findTokenById endpoint correctly", () => {
      const endpoint = api.endpoints.findTokenById;
      expect(endpoint).toBeDefined();
      expect(endpoint.select).toBeDefined();
      expect(endpoint.initiate).toBeDefined();
    });

    it("should configure findTokenByAddressInCurrency endpoint correctly", () => {
      const endpoint = api.endpoints.findTokenByAddressInCurrency;
      expect(endpoint).toBeDefined();
      expect(endpoint.select).toBeDefined();
      expect(endpoint.initiate).toBeDefined();
    });
  });

  describe("Cache Configuration", () => {
    it("should create API with cache adapter", () => {
      const apiWithCache = createCryptoAssetsApi({
        baseUrl,
        cacheAdapter: mockCacheAdapter,
        clientVersion: "2.130.0",
      });
      expect(apiWithCache).toBeDefined();
    });
  });

  describe("Client Version Header", () => {
    it("should create API with client version", () => {
      const apiWithVersion = createCryptoAssetsApi({
        baseUrl,
        cacheAdapter: mockCacheAdapter,
        clientVersion: "2.130.0",
      });
      expect(apiWithVersion).toBeDefined();
    });
  });

  describe("API Structure", () => {
    it("should have middleware", () => {
      expect(api.middleware).toBeDefined();
    });

    it("should have reducer", () => {
      expect(api.reducer).toBeDefined();
    });

    it("should have util", () => {
      expect(api.util).toBeDefined();
    });
  });

  describe("Zod Schema Validation", () => {
    it("should validate correct token data", () => {
      const validToken = {
        id: "test-token",
        name: "Test Token",
        ticker: "TEST",
        contract_address: "0x123",
        network: "ethereum",
        standard: "erc20",
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
      };

      expect(() => ApiTokenSchema.parse(validToken)).not.toThrow();
    });

    it("should reject invalid token data", () => {
      const invalidToken = {
        id: "test-token",
        // Missing required fields
      };

      expect(() => ApiTokenSchema.parse(invalidToken)).toThrow();
    });

    it("should handle optional fields", () => {
      const tokenWithOptionalFields = {
        id: "test-token",
        name: "Test Token",
        ticker: "TEST",
        contract_address: "0x123",
        network: "ethereum",
        standard: "erc20",
        decimals: 18, // Optional field
        live_signature: "0xabc", // Optional field
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
      };

      expect(() => ApiTokenSchema.parse(tokenWithOptionalFields)).not.toThrow();
    });
  });
});
