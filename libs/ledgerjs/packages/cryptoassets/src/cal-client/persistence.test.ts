/**
 * Tests for token persistence utilities
 */

import { findCryptoCurrencyById } from "../currencies";
import {
  toTokenCurrencyRaw,
  fromTokenCurrencyRaw,
  extractTokensFromState,
  filterExpiredTokens,
  restoreTokensToCache,
  type TokenCurrencyRaw,
  type PersistedTokenEntry,
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
    it("should restore valid tokens to RTK Query cache", () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;

      const tokens: PersistedTokenEntry[] = [
        {
          data: toTokenCurrencyRaw(mockToken),
          timestamp: now,
        },
      ];

      restoreTokensToCache(mockDispatch, tokens, ttl);

      // Should dispatch once with upsertQueryEntries (which contains both ID and address entries)
      expect(mockDispatch).toHaveBeenCalledTimes(1);

      // upsertQueryEntries returns action objects, not functions
      expect(mockDispatch).toHaveBeenCalled();
    });

    it("should skip expired tokens", () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;

      const tokens: PersistedTokenEntry[] = [
        {
          data: toTokenCurrencyRaw(mockToken),
          timestamp: now - 25 * 60 * 60 * 1000, // Expired
        },
      ];

      restoreTokensToCache(mockDispatch, tokens, ttl);

      // Should not dispatch anything for expired tokens
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("should skip tokens with missing parent currency", () => {
      const mockDispatch = jest.fn();
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;

      const tokens: PersistedTokenEntry[] = [
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
      ];

      restoreTokensToCache(mockDispatch, tokens, ttl);

      // Should not dispatch for tokens with missing parent
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
