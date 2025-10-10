import { createPersistentBaseQuery, HttpCacheResult } from "../rtk";
import type { CacheEntry } from "../types";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Mock fetchBaseQuery
jest.mock("@reduxjs/toolkit/query/react", () => ({
  fetchBaseQuery: jest.fn(),
}));

const mockFetchBaseQuery = fetchBaseQuery as jest.MockedFunction<typeof fetchBaseQuery>;

describe("createPersistentBaseQuery", () => {
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

  const mockValidateAndTransform = jest.fn((data: unknown) => data);

  const config = {
    baseUrl,
    cacheAdapter: mockCacheAdapter,
    clientVersion: "2.130.0",
    validateAndTransformResponse: mockValidateAndTransform,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for fetchBaseQuery
    mockFetchBaseQuery.mockReturnValue(jest.fn().mockResolvedValue({ data: { test: "data" } }));
  });

  it("should create a base query function", () => {
    const baseQuery = createPersistentBaseQuery(config);
    expect(typeof baseQuery).toBe("function");
  });

  it("should configure headers correctly", () => {
    createPersistentBaseQuery(config);

    expect(mockFetchBaseQuery).toHaveBeenCalledWith({
      baseUrl: "https://api.example.com",
      prepareHeaders: expect.any(Function),
    });

    // Test the prepareHeaders function
    const callArgs = mockFetchBaseQuery.mock.calls[0][0];
    const mockHeaders = new Map();
    const headers = {
      set: jest.fn((key, value) => mockHeaders.set(key, value)),
    };

    const result = callArgs.prepareHeaders(headers);

    expect(headers.set).toHaveBeenCalledWith("Content-Type", "application/json");
    expect(headers.set).toHaveBeenCalledWith("X-Ledger-Client-Version", "2.130.0");
    expect(result).toBe(headers);
  });

  it("should return cached data when available and fresh", async () => {
    const mockData = { test: "data" };
    const cachedEntry: CacheEntry<HttpCacheResult> = {
      data: { data: mockData },
      timestamp: Date.now() - 1000,
      expiresAt: Date.now() + 3600000, // 1 hour from now
      refreshAt: Date.now() + 1800000, // 30 minutes from now
      ttl: 3600000,
      version: 1,
    };

    mockCacheAdapter.get.mockResolvedValue(cachedEntry);
    mockValidateAndTransform.mockReturnValue(mockData);

    const baseQuery = createPersistentBaseQuery(config);
    const args = { url: "/test", params: {} };

    const result = await baseQuery(args, {}, {});

    expect(result).toEqual({ data: mockData });
    expect(mockCacheAdapter.get).toHaveBeenCalledWith("/test?");
    expect(mockValidateAndTransform).toHaveBeenCalledWith(mockData);
    expect(mockCacheAdapter.set).not.toHaveBeenCalled();
  });

  it("should handle undefined cached data", async () => {
    const undefinedDataCachedEntry: CacheEntry<HttpCacheResult> = {
      data: { data: undefined },
      timestamp: Date.now() - 1000,
      expiresAt: Date.now() + 3600000,
      refreshAt: Date.now() + 1800000,
      ttl: 3600000,
      version: 1,
    };

    mockCacheAdapter.get.mockResolvedValue(undefinedDataCachedEntry);
    mockValidateAndTransform.mockReturnValue(undefined);

    const baseQuery = createPersistentBaseQuery(config);
    const args = { url: "/test", params: {} };

    const result = await baseQuery(args, {}, {});

    expect(result).toEqual({ data: undefined });
  });

  it("should refresh stale cache and return fresh data", async () => {
    const now = Date.now();
    const staleEntry: CacheEntry<HttpCacheResult> = {
      data: { data: { old: "data" } },
      timestamp: now - 2000000, // 2 hours ago
      expiresAt: now + 3600000, // Still valid for 1 hour
      refreshAt: now - 1000, // Stale (refresh time passed)
      ttl: 3600000,
      version: 1,
    };

    const freshData = { new: "data" };
    const mockBaseQuery = jest.fn().mockResolvedValue({ data: freshData });

    // Mock fetchBaseQuery to return our specific mock for this test
    mockFetchBaseQuery.mockReturnValue(mockBaseQuery);

    mockCacheAdapter.get.mockResolvedValue(staleEntry);
    mockValidateAndTransform.mockReturnValue(freshData);

    const baseQuery = createPersistentBaseQuery(config);
    const args = { url: "/test", params: {} };

    const result = await baseQuery(args, {}, {});

    expect(result).toEqual({ data: freshData });
    expect(mockCacheAdapter.get).toHaveBeenCalledWith("/test?");
    expect(mockBaseQuery).toHaveBeenCalledWith(args, {}, {});
    expect(mockValidateAndTransform).toHaveBeenCalledWith(freshData);
    expect(mockCacheAdapter.set).toHaveBeenCalledWith("/test?", { data: freshData });
  });
});
