import { createPersistentBaseQuery } from "../rtk";

// Mock console.error to capture error logs
const mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});

// Mock fetchBaseQuery
jest.mock("@reduxjs/toolkit/query/react", () => ({
  fetchBaseQuery: jest.fn(() =>
    jest.fn().mockResolvedValue({
      data: { test: "data" },
    }),
  ),
}));

// Mock cache adapter that throws errors
const mockCacheAdapter = {
  ttl: 3600,
  refreshTtl: 900,
  version: 1,
  get: jest.fn().mockRejectedValue(new Error("Cache get failed")),
  set: jest.fn().mockRejectedValue(new Error("Cache set failed")),
  delete: jest.fn(),
  clear: jest.fn(),
  cleanupExpired: jest.fn(),
};

describe("Error Logging", () => {
  beforeEach(() => {
    mockConsoleError.mockClear();
    mockCacheAdapter.get.mockClear();
    mockCacheAdapter.set.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it("should log cache get errors", async () => {
    const baseQuery = createPersistentBaseQuery({
      baseUrl: "https://api.example.com",
      cacheAdapter: mockCacheAdapter,
      clientVersion: "1.0.0",
      validateAndTransformResponse: (data: unknown) => data,
    });

    await baseQuery({ url: "/test", params: {} }, {} as any, {} as any);

    expect(mockConsoleError).toHaveBeenCalledWith("Cache get error:", expect.any(Error));
  });

  it("should log cache set errors", async () => {
    // Mock successful get but failing set
    mockCacheAdapter.get.mockResolvedValue(null);

    const baseQuery = createPersistentBaseQuery({
      baseUrl: "https://api.example.com",
      cacheAdapter: mockCacheAdapter,
      clientVersion: "1.0.0",
      validateAndTransformResponse: (data: unknown) => data,
    });

    await baseQuery({ url: "/test", params: {} }, {} as any, {} as any);

    expect(mockConsoleError).toHaveBeenCalledWith("Cache set error:", expect.any(Error));
  });
});
