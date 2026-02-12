/**
 * Tests for token persistence utilities
 */

import { findCryptoCurrencyById } from "../currencies";
import {
  toTokenCurrencyRaw,
  fromTokenCurrencyRaw,
  extractTokensFromState,
  extractHashesFromState,
  extractPersistedCALFromState,
  persistedCALContentEqual,
  filterExpiredTokens,
  restoreTokensToCache,
  PERSISTENCE_VERSION,
  type TokenCurrencyRaw,
  type PersistedTokenEntry,
  type PersistedCAL,
  type StateWithCryptoAssets,
} from "./persistence";
import { cryptoAssetsApi } from "./state-manager/api";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("Token Persistence", () => {
  // Mock token for testing
  const mockToken: TokenCurrency = {
    type: "TokenCurrency",
    id: "ethereum/erc20/usdt",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    parentCurrency: findCryptoCurrencyById("ethereum")!,
    tokenType: "erc20",
    name: "Tether USD",
    ticker: "USDT",
    delisted: false,
    disableCountervalue: false,
    units: [
      {
        name: "USDT",
        code: "USDT",
        magnitude: 6,
      },
    ],
  };

  describe("toTokenCurrencyRaw", () => {
    it("should convert TokenCurrency to Raw format", () => {
      const raw = toTokenCurrencyRaw(mockToken);

      expect(raw).toEqual({
        id: "ethereum/erc20/usdt",
        contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        parentCurrencyId: "ethereum", // Object replaced with ID
        tokenType: "erc20",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
        delisted: false,
        disableCountervalue: false,
        ledgerSignature: undefined,
      });

      // Verify it's JSON-serializable
      expect(() => JSON.stringify(raw)).not.toThrow();
    });

    it("should handle token with ledgerSignature", () => {
      const tokenWithSig = {
        ...mockToken,
        ledgerSignature: "0x123abc",
      };

      const raw = toTokenCurrencyRaw(tokenWithSig);

      expect(raw.ledgerSignature).toBe("0x123abc");
    });
  });

  describe("fromTokenCurrencyRaw", () => {
    it("should reconstruct TokenCurrency from Raw format", () => {
      const raw: TokenCurrencyRaw = {
        id: "ethereum/erc20/usdt",
        contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        parentCurrencyId: "ethereum",
        tokenType: "erc20",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
        delisted: false,
        disableCountervalue: false,
      };

      const token = fromTokenCurrencyRaw(raw);

      expect(token).toBeDefined();
      expect(token!.id).toBe("ethereum/erc20/usdt");
      expect(token!.contractAddress).toBe("0xdac17f958d2ee523a2206206994597c13d831ec7");
      expect(token!.parentCurrency).toBeDefined();
      expect(token!.parentCurrency.id).toBe("ethereum");
      expect(token!.tokenType).toBe("erc20");
    });

    it("should return undefined if parent currency not found", () => {
      const raw: TokenCurrencyRaw = {
        id: "unknown/token/test",
        contractAddress: "0xabc",
        parentCurrencyId: "unknown_currency_xyz",
        tokenType: "erc20",
        name: "Test",
        ticker: "TEST",
        units: [{ name: "TEST", code: "TEST", magnitude: 18 }],
      };

      const token = fromTokenCurrencyRaw(raw);

      expect(token).toBeUndefined();
    });
  });

  describe("Round-trip conversion", () => {
    it("should preserve token data through serialization cycle", () => {
      // Convert to Raw format
      const raw = toTokenCurrencyRaw(mockToken);

      // Serialize to JSON (simulating storage)
      const json = JSON.stringify(raw);

      // Parse back
      const parsed = JSON.parse(json) as TokenCurrencyRaw;

      // Reconstruct token
      const token = fromTokenCurrencyRaw(parsed);

      // Verify all fields match
      expect(token).toBeDefined();
      expect(token!.id).toBe(mockToken.id);
      expect(token!.contractAddress).toBe(mockToken.contractAddress);
      expect(token!.parentCurrency.id).toBe(mockToken.parentCurrency.id);
      expect(token!.name).toBe(mockToken.name);
      expect(token!.ticker).toBe(mockToken.ticker);
    });
  });

  describe("extractTokensFromState", () => {
    it("should extract fulfilled token queries from RTK state", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: mockToken,
              endpointName: "findTokenById",
              fulfilledTimeStamp: Date.now(),
            },
          },
        },
      } as unknown as StateWithCryptoAssets;

      const tokens = extractTokensFromState(mockState);

      expect(tokens).toHaveLength(1);
      expect(tokens[0].data.id).toBe("ethereum/erc20/usdt");
      expect(tokens[0].data.contractAddress).toBe("0xdac17f958d2ee523a2206206994597c13d831ec7");
      expect(tokens[0].data.parentCurrencyId).toBe("ethereum");
      expect(tokens[0].timestamp).toBeDefined();
    });

    it("should ignore pending queries", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "pending",
              data: undefined,
              endpointName: "findTokenById",
            },
          },
        },
      } as unknown as StateWithCryptoAssets;

      const tokens = extractTokensFromState(mockState);

      expect(tokens).toHaveLength(0);
    });

    it("should deduplicate tokens by ID", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: mockToken,
              endpointName: "findTokenById",
              fulfilledTimeStamp: Date.now(),
            },
            'findTokenByAddressInCurrency({"contract_address":"0xdac17f958d2ee523a2206206994597c13d831ec7","network":"ethereum"})':
              {
                status: "fulfilled",
                data: mockToken, // Same token, different query
                endpointName: "findTokenByAddressInCurrency",
                fulfilledTimeStamp: Date.now(),
              },
          },
        },
      } as unknown as StateWithCryptoAssets;

      const tokens = extractTokensFromState(mockState);

      // Should only have one token despite two queries
      expect(tokens).toHaveLength(1);
    });

    it("should return empty array if no queries", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {},
        },
      } as unknown as StateWithCryptoAssets;

      const tokens = extractTokensFromState(mockState);

      expect(tokens).toEqual([]);
    });

    it("should return empty array if no RTK Query state", () => {
      const mockState = {} as unknown as StateWithCryptoAssets;

      const tokens = extractTokensFromState(mockState);

      expect(tokens).toEqual([]);
    });

    it("should return empty array if queries is undefined", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {},
      } as unknown as StateWithCryptoAssets;

      const tokens = extractTokensFromState(mockState);

      expect(tokens).toEqual([]);
    });
  });

  describe("filterExpiredTokens", () => {
    it("should keep tokens within TTL", () => {
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000; // 24 hours

      const tokens: PersistedTokenEntry[] = [
        {
          data: {
            id: "ethereum/erc20/usdt",
            contractAddress: "0xabc",
            parentCurrencyId: "ethereum",
            tokenType: "erc20",
            name: "Test",
            ticker: "TEST",
            units: [],
          },
          timestamp: now - 1000, // 1 second ago
        },
        {
          data: {
            id: "ethereum/erc20/usdc",
            contractAddress: "0xdef",
            parentCurrencyId: "ethereum",
            tokenType: "erc20",
            name: "Test",
            ticker: "TEST",
            units: [],
          },
          timestamp: now - 12 * 60 * 60 * 1000, // 12 hours ago
        },
      ];

      const filtered = filterExpiredTokens(tokens, ttl);

      expect(filtered).toHaveLength(2);
    });

    it("should filter out expired tokens", () => {
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000; // 24 hours

      const tokens: PersistedTokenEntry[] = [
        {
          data: {
            id: "ethereum/erc20/usdt",
            contractAddress: "0xabc",
            parentCurrencyId: "ethereum",
            tokenType: "erc20",
            name: "Test",
            ticker: "TEST",
            units: [],
          },
          timestamp: now - 1000, // 1 second ago - VALID
        },
        {
          data: {
            id: "ethereum/erc20/old",
            contractAddress: "0xold",
            parentCurrencyId: "ethereum",
            tokenType: "erc20",
            name: "Old",
            ticker: "OLD",
            units: [],
          },
          timestamp: now - 25 * 60 * 60 * 1000, // 25 hours ago - EXPIRED
        },
      ];

      const filtered = filterExpiredTokens(tokens, ttl);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].data.id).toBe("ethereum/erc20/usdt");
    });
  });

  describe("restoreTokensToCache", () => {
    it("should restore valid tokens to RTK Query cache", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now,
          },
        ],
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      // Should dispatch once with upsertQueryEntries (which contains both ID and address entries)
      expect(mockDispatch).toHaveBeenCalledTimes(1);

      expect(mockDispatch).toHaveBeenCalled();
    });

    it("should skip expired tokens", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now - 25 * 60 * 60 * 1000,
          },
        ],
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("should skip tokens with missing parent currency", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: {
              id: "unknown/token/test",
              contractAddress: "0xabc",
              parentCurrencyId: "unknown_currency",
              tokenType: "erc20",
              name: "Test",
              ticker: "TEST",
              units: [{ name: "TEST", code: "TEST", magnitude: 18 }],
            },
            timestamp: now,
          },
        ],
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("should restore tokens when hash matches", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;
      const storedHash = "hash123";

      mockDispatch.mockImplementation(async action => {
        if (typeof action === "function") {
          const thunkResult = await action(mockDispatch, () => ({}), undefined);
          return thunkResult;
        }
        const actionStr = String(action);
        if (
          actionStr.includes("getTokensSyncHash") ||
          (action as any)?.type?.includes("getTokensSyncHash")
        ) {
          return { data: storedHash, error: undefined };
        }
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now,
          },
        ],
        hashes: { ethereum: storedHash },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      const invalidateCalls = mockDispatch.mock.calls.filter(call => {
        const action = call[0];
        if (!action) return false;
        const callStr = String(action);
        return (
          callStr.includes("invalidateTags") || (action as any)?.type?.includes("invalidateTags")
        );
      });
      expect(invalidateCalls).toHaveLength(0);
      expect(mockDispatch).toHaveBeenCalled();
    });

    it("should skip restore when hash changed", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;
      const storedHash = "hash123";
      const currentHash = "hash456";
      const upsertActions: any[] = [];

      mockDispatch.mockImplementation(async action => {
        if (typeof action === "function") {
          const actionStr = String(action);
          if (actionStr.includes("getTokensSyncHash")) {
            return { data: currentHash, error: undefined };
          }
          const result = await action(mockDispatch, () => ({}), undefined);
          return result;
        }
        const actionType = (action as any)?.type || "";
        if (actionType.includes("upsertQueryEntries") || actionType.includes("upsert")) {
          upsertActions.push(action);
        }
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now,
          },
        ],
        hashes: { ethereum: storedHash },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(upsertActions).toHaveLength(0);
    });

    it("should return early when all tokens are evicted after hash validation", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;
      const storedHash = "hash123";
      const currentHash = "hash456";
      const upsertActions: any[] = [];

      mockDispatch.mockImplementation(async action => {
        if (typeof action === "function") {
          const actionStr = String(action);
          if (actionStr.includes("getTokensSyncHash")) {
            return { data: currentHash, error: undefined };
          }
          const result = await action(mockDispatch, () => ({}), undefined);
          return result;
        }
        const actionType = (action as any)?.type || "";
        if (actionType.includes("upsertQueryEntries") || actionType.includes("upsert")) {
          upsertActions.push(action);
        }
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now,
          },
        ],
        hashes: { ethereum: storedHash },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(upsertActions).toHaveLength(0);
    });

    it("should skip restore when hash fetch fails", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;
      const storedHash = "hash123";
      const upsertActions: any[] = [];

      mockDispatch.mockImplementation(async action => {
        if (typeof action === "function") {
          const actionStr = String(action);
          if (actionStr.includes("getTokensSyncHash")) {
            throw new Error("Network error");
          }
          const result = await action(mockDispatch, () => ({}), undefined);
          return result;
        }
        const actionType = (action as any)?.type || "";
        if (actionType.includes("upsertQueryEntries") || actionType.includes("upsert")) {
          upsertActions.push(action);
        }
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now,
          },
        ],
        hashes: { ethereum: storedHash },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(upsertActions).toHaveLength(0);
    });

    it("should restore tokens when currentHash is undefined (cannot validate)", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;
      const storedHash = "hash123";
      const upsertActions: any[] = [];

      mockDispatch.mockImplementation(async action => {
        if (typeof action === "function") {
          const actionStr = String(action);
          if (actionStr.includes("getTokensSyncHash")) {
            return { data: undefined, error: undefined };
          }
          if (actionStr.includes("upsertQueryEntries") || actionStr.includes("upsert")) {
            upsertActions.push(action);
          }
          const result = await action(mockDispatch, () => ({}), undefined);
          return result;
        }
        const actionType = (action as any)?.type || "";
        if (actionType.includes("upsertQueryEntries") || actionType.includes("upsert")) {
          upsertActions.push(action);
        }
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now,
          },
        ],
        hashes: { ethereum: storedHash },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(upsertActions.length).toBeGreaterThan(0);
    });

    it("should restore tokens without hash (backward compatibility)", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now,
          },
        ],
        // No hashes field - old persisted data
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      const invalidateCalls = mockDispatch.mock.calls.filter(call => {
        const action = call[0];
        if (!action) return false;
        const callStr = String(action);
        return (
          callStr.includes("invalidateTags") || (action as any)?.type?.includes("invalidateTags")
        );
      });
      expect(invalidateCalls).toHaveLength(0);
      expect(mockDispatch).toHaveBeenCalled();
    });

    it("should handle multiple currencies with different hash states", async () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;
      let getHashCallCount = 0;
      const upsertActions: any[] = [];

      const polygonToken: TokenCurrency = {
        ...mockToken,
        id: "polygon/erc20/usdt",
        parentCurrency: findCryptoCurrencyById("polygon")!,
      };

      mockDispatch.mockImplementation(async action => {
        if (typeof action === "function") {
          const actionStr = String(action);
          if (actionStr.includes("getTokensSyncHash")) {
            getHashCallCount++;
            if (getHashCallCount === 2) {
              return { data: "hash999", error: undefined };
            }
            return { data: "hash123", error: undefined };
          }
          if (actionStr.includes("upsertQueryEntries") || actionStr.includes("upsert")) {
            upsertActions.push(action);
          }
          const result = await action(mockDispatch, () => ({}), undefined);
          return result;
        }
        const actionType = (action as any)?.type || "";
        if (actionType.includes("upsertQueryEntries") || actionType.includes("upsert")) {
          upsertActions.push(action);
        }
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: toTokenCurrencyRaw(mockToken),
            timestamp: now,
          },
          {
            data: toTokenCurrencyRaw(polygonToken),
            timestamp: now,
          },
        ],
        hashes: {
          ethereum: "hash123",
          polygon: "hash456",
        },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(upsertActions.length).toBeGreaterThan(0);
    });
  });

  describe("extractHashesFromState", () => {
    it("should extract hashes from getTokensSyncHash queries", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'getTokensSyncHash("ethereum")': {
              status: "fulfilled",
              data: "hash123",
              endpointName: "getTokensSyncHash",
            },
            'getTokensSyncHash("polygon")': {
              status: "fulfilled",
              data: "hash456",
              endpointName: "getTokensSyncHash",
            },
          },
        },
      } as unknown as StateWithCryptoAssets;

      const hashes = extractHashesFromState(mockState);

      expect(hashes).toEqual({
        ethereum: "hash123",
        polygon: "hash456",
      });
    });

    it("should return empty object when no hash queries exist", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: mockToken,
              endpointName: "findTokenById",
            },
          },
        },
      } as unknown as StateWithCryptoAssets;

      const hashes = extractHashesFromState(mockState);

      expect(hashes).toEqual({});
    });

    it("should return empty object if no RTK Query state", () => {
      const mockState = {} as unknown as StateWithCryptoAssets;

      const hashes = extractHashesFromState(mockState);

      expect(hashes).toEqual({});
    });

    it("should return empty object if queries is undefined", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {},
      } as unknown as StateWithCryptoAssets;

      const hashes = extractHashesFromState(mockState);

      expect(hashes).toEqual({});
    });
  });

  describe("extractPersistedCALFromState", () => {
    it("should extract complete PersistedCAL with tokens and hashes", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: mockToken,
              endpointName: "findTokenById",
              fulfilledTimeStamp: Date.now(),
            },
            'getTokensSyncHash("ethereum")': {
              status: "fulfilled",
              data: "hash123",
              endpointName: "getTokensSyncHash",
            },
          },
        },
      } as unknown as StateWithCryptoAssets;

      const persistedData = extractPersistedCALFromState(mockState);

      expect(persistedData.version).toBe(PERSISTENCE_VERSION);
      expect(persistedData.tokens).toHaveLength(1);
      expect(persistedData.tokens[0].data.id).toBe("ethereum/erc20/usdt");
      expect(persistedData.hashes).toEqual({ ethereum: "hash123" });
    });

    it("should extract PersistedCAL without hashes if none exist", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: mockToken,
              endpointName: "findTokenById",
              fulfilledTimeStamp: Date.now(),
            },
          },
        },
      } as unknown as StateWithCryptoAssets;

      const persistedData = extractPersistedCALFromState(mockState);

      expect(persistedData.version).toBe(PERSISTENCE_VERSION);
      expect(persistedData.tokens).toHaveLength(1);
      expect(persistedData.hashes).toBeUndefined();
    });

    it("should return empty tokens array if no tokens found", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'getTokensSyncHash("ethereum")': {
              status: "fulfilled",
              data: "hash123",
              endpointName: "getTokensSyncHash",
            },
          },
        },
      } as unknown as StateWithCryptoAssets;

      const persistedData = extractPersistedCALFromState(mockState);

      expect(persistedData.version).toBe(PERSISTENCE_VERSION);
      expect(persistedData.tokens).toHaveLength(0);
      expect(persistedData.hashes).toEqual({ ethereum: "hash123" });
    });
  });

  describe("persistedCALContentEqual", () => {
    const baseTokenData: TokenCurrencyRaw = {
      id: "ethereum/erc20/usdt",
      contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      parentCurrencyId: "ethereum",
      tokenType: "erc20",
      name: "Tether USD",
      ticker: "USDT",
      units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
    };

    it("should return true when both are null", () => {
      expect(persistedCALContentEqual(null, null)).toBe(true);
    });

    it("should return false when one is null and the other is not", () => {
      const cal: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
      };
      expect(persistedCALContentEqual(null, cal)).toBe(false);
      expect(persistedCALContentEqual(cal, null)).toBe(false);
    });

    it("should return true for same version, hashes, and token data with different timestamps", () => {
      const a: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
        hashes: { ethereum: "hash1" },
      };
      const b: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 2000 }],
        hashes: { ethereum: "hash1" },
      };
      expect(persistedCALContentEqual(a, b)).toBe(true);
    });

    it("should return false when version differs", () => {
      const a: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
      };
      const b: PersistedCAL = {
        version: PERSISTENCE_VERSION - 1,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
      };
      expect(persistedCALContentEqual(a, b)).toBe(false);
    });

    it("should return false when hashes differ", () => {
      const a: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
        hashes: { ethereum: "hash1" },
      };
      const b: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
        hashes: { ethereum: "hash2" },
      };
      expect(persistedCALContentEqual(a, b)).toBe(false);
    });

    it("should return false when token set differs", () => {
      const a: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
      };
      const otherTokenData: TokenCurrencyRaw = {
        ...baseTokenData,
        id: "ethereum/erc20/usdc",
        contractAddress: "0xa0b8",
        ticker: "USDC",
      };
      const b: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          { data: baseTokenData, timestamp: 1000 },
          { data: otherTokenData, timestamp: 1000 },
        ],
      };
      expect(persistedCALContentEqual(a, b)).toBe(false);
    });

    it("should return false when token data differs", () => {
      const a: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
      };
      const b: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          {
            data: { ...baseTokenData, ticker: "USDC" },
            timestamp: 1000,
          },
        ],
      };
      expect(persistedCALContentEqual(a, b)).toBe(false);
    });
  });
});
