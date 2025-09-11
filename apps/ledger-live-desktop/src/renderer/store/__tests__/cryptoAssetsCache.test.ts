import { CryptoAssetsCache } from "../cryptoAssetsCache";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

// Mock localStorage
const mockLocalStorage: {
  store: Record<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
} = {
  store: {},
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Set up the mock behavior
mockLocalStorage.getItem = jest.fn((key: string) => mockLocalStorage.store[key] || null);
mockLocalStorage.setItem = jest.fn((key: string, value: string) => {
  mockLocalStorage.store[key] = value;
});
mockLocalStorage.removeItem = jest.fn((key: string) => {
  delete mockLocalStorage.store[key];
});
mockLocalStorage.clear = jest.fn(() => {
  mockLocalStorage.store = {};
});

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

const mockToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usdt",
  name: "Tether USD",
  ticker: "USDT",
  contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentCurrency: {} as any,
  tokenType: "erc20",
  units: [
    {
      code: "USDT",
      name: "Tether USD",
      magnitude: 6,
    },
  ],
};

describe("CryptoAssetsCache", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it("should add and retrieve tokens", () => {
    CryptoAssetsCache.addToken("test-key", mockToken);
    const retrieved = CryptoAssetsCache.getToken("test-key");

    expect(retrieved).toEqual(mockToken);
  });

  it("should return null for non-existent tokens", () => {
    const retrieved = CryptoAssetsCache.getToken("non-existent");
    expect(retrieved).toBeNull();
  });

  it("should return null for expired tokens", () => {
    // Add token with past expiry
    const now = Date.now();
    const expiredData = {
      version: 1,
      tokens: {
        "expired-key": {
          id: "expired-key",
          data: mockToken,
          timestamp: now - 3600000,
          expiresAt: now - 1000, // Expired 1 second ago
        },
      },
      lastUpdated: now - 3600000,
    };

    mockLocalStorage.setItem("ledger-live-crypto-assets-cache", JSON.stringify(expiredData));

    const retrieved = CryptoAssetsCache.getToken("expired-key");
    expect(retrieved).toBeNull();
  });

  it("should clear cache", () => {
    CryptoAssetsCache.addToken("test-key", mockToken);
    CryptoAssetsCache.clear();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("ledger-live-crypto-assets-cache");
  });

  it("should return correct stats", () => {
    CryptoAssetsCache.addToken("test-key-1", mockToken);
    CryptoAssetsCache.addToken("test-key-2", mockToken);

    const stats = CryptoAssetsCache.getStats();

    expect(stats.tokenCount).toBe(2);
    expect(stats.lastUpdated).toBeInstanceOf(Date);
    expect(stats.cacheSize).toMatch(/\d+\.\d+ KB/);
  });
});
