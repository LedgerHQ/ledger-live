import { configureStore } from "@reduxjs/toolkit";
import { token, type TokenCurrency } from "@domain/entity-currency-token";
import { calApiExtra } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import { PERSISTENCE_VERSION } from "./internals";
import {
  extractTokensFromState,
  extractHashesFromState,
  extractPersistedCALFromState,
  persistedCALContentEqual,
  filterExpiredTokens,
  restoreTokensToCache,
  parsePersistedCAL,
  type WithCryptoAssetsApi,
} from "./persistence";
import { type PersistedCAL, type PersistedTokenEntry } from "./types";

const mockToken: TokenCurrency = token({
  type: "TokenCurrency",
  id: "ethereum/erc20/usdt",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  parentCurrencyId: "ethereum",
  tokenType: "erc20",
  name: "Tether USD",
  ticker: "USDT",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
});

describe("Token Persistence", () => {
  describe("parsePersistedCAL", () => {
    it("parses a valid persisted blob and re-validates tokens", () => {
      const blob = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: 1000 }],
        hashes: { ethereum: "hash1" },
      };

      const parsed = parsePersistedCAL(blob);

      expect(parsed).not.toBeNull();
      expect(parsed?.tokens[0].data.id).toBe("ethereum/erc20/usdt");
      expect(parsed?.hashes).toEqual({ ethereum: "hash1" });
    });

    it("survives a JSON serialization round-trip", () => {
      const extracted = extractPersistedCALFromState({
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
      } as unknown as WithCryptoAssetsApi);

      const parsed = parsePersistedCAL(JSON.parse(JSON.stringify(extracted)));

      expect(parsed?.tokens[0].data).toEqual(mockToken);
    });

    it("returns null for an older format version", () => {
      expect(parsePersistedCAL({ version: PERSISTENCE_VERSION - 1, tokens: [] })).toBeNull();
    });

    it("returns null for a version 2 blob, which may hold TRC10 tokens without an identifier", () => {
      const trc10Token = token({
        ...mockToken,
        id: "tron/trc10/1002000",
        contractAddress: "TF5Bn4cJCT6GVeUgyCN4rBhDg42KBrpAjg",
        parentCurrencyId: "tron",
        tokenType: "trc10",
      });

      expect(
        parsePersistedCAL({ version: 2, tokens: [{ data: trc10Token, timestamp: Date.now() }] }),
      ).toBeNull();
    });

    it("returns null for a malformed token", () => {
      expect(
        parsePersistedCAL({
          version: PERSISTENCE_VERSION,
          tokens: [{ data: { id: "x" }, timestamp: 1 }],
        }),
      ).toBeNull();
    });

    it("returns null for non-object input", () => {
      expect(parsePersistedCAL("nope")).toBeNull();
      expect(parsePersistedCAL(null)).toBeNull();
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
      } as unknown as WithCryptoAssetsApi;

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
      } as unknown as WithCryptoAssetsApi;

      expect(extractTokensFromState(mockState)).toHaveLength(0);
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
                data: mockToken,
                endpointName: "findTokenByAddressInCurrency",
                fulfilledTimeStamp: Date.now(),
              },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      expect(extractTokensFromState(mockState)).toHaveLength(1);
    });

    it("should return empty array if no queries", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: { queries: {} },
      } as unknown as WithCryptoAssetsApi;

      expect(extractTokensFromState(mockState)).toEqual([]);
    });

    it("should return empty array if no RTK Query state", () => {
      expect(extractTokensFromState({} as unknown as WithCryptoAssetsApi)).toEqual([]);
    });

    it("should return empty array if queries is undefined", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {},
      } as unknown as WithCryptoAssetsApi;

      expect(extractTokensFromState(mockState)).toEqual([]);
    });

    it("should extract token_identifier from findTokenByAddressInCurrency originalArgs", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenByAddressInCurrency({"contract_address":"0xdac17f958d2ee523a2206206994597c13d831ec7","network":"ethereum","token_identifier":"MYTOKEN-abc123"})':
              {
                status: "fulfilled",
                data: mockToken,
                endpointName: "findTokenByAddressInCurrency",
                originalArgs: {
                  contract_address: mockToken.contractAddress,
                  network: mockToken.parentCurrencyId,
                  token_identifier: "MYTOKEN-abc123",
                },
                fulfilledTimeStamp: Date.now(),
              },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      const tokens = extractTokensFromState(mockState);

      expect(tokens).toHaveLength(1);
      expect(tokens[0].token_identifier).toBe("MYTOKEN-abc123");
    });

    it("should not set token_identifier for findTokenById queries", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: mockToken,
              endpointName: "findTokenById",
              originalArgs: { id: mockToken.id },
              fulfilledTimeStamp: Date.now(),
            },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      const tokens = extractTokensFromState(mockState);

      expect(tokens).toHaveLength(1);
      expect(tokens[0].token_identifier).toBeUndefined();
    });

    it("should record the token_identifier of a findTokenByTokenIdentifierInCurrency lookup", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenByTokenIdentifierInCurrency({"network":"ethereum","token_identifier":"42"})':
              {
                status: "fulfilled",
                data: mockToken,
                endpointName: "findTokenByTokenIdentifierInCurrency",
                originalArgs: { token_identifier: "42", network: mockToken.parentCurrencyId },
                fulfilledTimeStamp: Date.now(),
              },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      const tokens = extractTokensFromState(mockState);

      expect(tokens).toHaveLength(1);
      expect(tokens[0].token_identifier_lookup).toBe("42");
      expect(tokens[0].token_identifier).toBeUndefined();
    });

    it("should keep the lookup arguments of every query that reached the same token", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: mockToken,
              endpointName: "findTokenById",
              originalArgs: { id: mockToken.id },
              fulfilledTimeStamp: 1000,
            },
            'findTokenByAddressInCurrency({"contract_address":"0xdac17f958d2ee523a2206206994597c13d831ec7","network":"ethereum","token_identifier":"MYTOKEN-abc123"})':
              {
                status: "fulfilled",
                data: mockToken,
                endpointName: "findTokenByAddressInCurrency",
                originalArgs: {
                  contract_address: mockToken.contractAddress,
                  network: mockToken.parentCurrencyId,
                  token_identifier: "MYTOKEN-abc123",
                },
                fulfilledTimeStamp: 2000,
              },
            'findTokenByTokenIdentifierInCurrency({"network":"ethereum","token_identifier":"42"})':
              {
                status: "fulfilled",
                data: mockToken,
                endpointName: "findTokenByTokenIdentifierInCurrency",
                originalArgs: { token_identifier: "42", network: mockToken.parentCurrencyId },
                fulfilledTimeStamp: 3000,
              },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      expect(extractTokensFromState(mockState)).toEqual([
        {
          data: mockToken,
          timestamp: 3000,
          token_identifier: "MYTOKEN-abc123",
          token_identifier_lookup: "42",
        },
      ]);
    });

    it("should keep the latest fetched body of a token reached through several queries", () => {
      const staleToken = { ...mockToken, name: "Stale" };
      const freshToken = { ...mockToken, tokenIdentifier: "42" };
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: staleToken,
              endpointName: "findTokenById",
              originalArgs: { id: mockToken.id },
              fulfilledTimeStamp: 1000,
            },
            'findTokenByTokenIdentifierInCurrency({"network":"ethereum","token_identifier":"42"})':
              {
                status: "fulfilled",
                data: freshToken,
                endpointName: "findTokenByTokenIdentifierInCurrency",
                originalArgs: { token_identifier: "42", network: mockToken.parentCurrencyId },
                fulfilledTimeStamp: 3000,
              },
            'findTokenByAddressInCurrency({"contract_address":"0xdac17f958d2ee523a2206206994597c13d831ec7","network":"ethereum"})':
              {
                status: "fulfilled",
                data: staleToken,
                endpointName: "findTokenByAddressInCurrency",
                originalArgs: {
                  contract_address: mockToken.contractAddress,
                  network: mockToken.parentCurrencyId,
                },
                fulfilledTimeStamp: 2000,
              },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      expect(extractTokensFromState(mockState)).toEqual([
        { data: freshToken, timestamp: 3000, token_identifier_lookup: "42" },
      ]);
    });
  });

  describe("filterExpiredTokens", () => {
    const baseData = mockToken;

    it("should keep tokens within TTL", () => {
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;
      const tokens: PersistedTokenEntry[] = [
        { data: baseData, timestamp: now - 1000 },
        { data: baseData, timestamp: now - 12 * 60 * 60 * 1000 },
      ];

      expect(filterExpiredTokens(tokens, ttl)).toHaveLength(2);
    });

    it("should filter out expired tokens", () => {
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000;
      const tokens: PersistedTokenEntry[] = [
        { data: baseData, timestamp: now - 1000 },
        { data: baseData, timestamp: now - 25 * 60 * 60 * 1000 },
      ];

      expect(filterExpiredTokens(tokens, ttl)).toHaveLength(1);
    });
  });

  describe("restoreTokensToCache", () => {
    const ttl = 24 * 60 * 60 * 1000;

    it("should restore valid tokens to RTK Query cache", async () => {
      const mockDispatch = jest.fn();
      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: Date.now() }],
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it("should skip expired tokens", async () => {
      const mockDispatch = jest.fn();
      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: Date.now() - 25 * 60 * 60 * 1000 }],
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("should restore tokens even when the parent currency is unknown (guard moved to the converter)", async () => {
      const mockDispatch = jest.fn();
      const orphanToken = token({
        type: "TokenCurrency",
        id: "ethereum/erc20/orphan",
        contractAddress: "0xabc",
        parentCurrencyId: "unknown_currency",
        tokenType: "erc20",
        name: "Orphan",
        ticker: "ORPH",
        units: [{ name: "Orphan", code: "ORPH", magnitude: 18 }],
      });
      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: orphanToken, timestamp: Date.now() }],
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it("should restore tokens when hash matches", async () => {
      const storedHash = "hash123";
      const mockDispatch = jest.fn(async action => {
        if (typeof action === "function") {
          return { data: storedHash, error: undefined };
        }
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: Date.now() }],
        hashes: { ethereum: storedHash },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      const invalidateCalls = mockDispatch.mock.calls.filter(call =>
        String(call[0]).includes("invalidateTags"),
      );
      expect(invalidateCalls).toHaveLength(0);
      expect(mockDispatch).toHaveBeenCalled();
    });

    it("should skip restore when hash changed", async () => {
      const upsertActions: unknown[] = [];
      const mockDispatch = jest.fn(async action => {
        if (typeof action === "function") {
          return { data: "hash456", error: undefined };
        }
        const actionType = (action as { type?: string })?.type || "";
        if (actionType.includes("upsert")) upsertActions.push(action);
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: Date.now() }],
        hashes: { ethereum: "hash123" },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(upsertActions).toHaveLength(0);
    });

    it("should skip restore when hash fetch fails", async () => {
      const upsertActions: unknown[] = [];
      const mockDispatch = jest.fn(async action => {
        if (typeof action === "function") {
          throw new Error("Network error");
        }
        const actionType = (action as { type?: string })?.type || "";
        if (actionType.includes("upsert")) upsertActions.push(action);
        return action;
      });

      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: Date.now() }],
        hashes: { ethereum: "hash123" },
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(upsertActions).toHaveLength(0);
    });

    it("should restore tokens without hash (backward compatibility)", async () => {
      const mockDispatch = jest.fn();
      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: Date.now() }],
      };

      await restoreTokensToCache(mockDispatch, persistedData, ttl);

      const invalidateCalls = mockDispatch.mock.calls.filter(call =>
        String(call[0]).includes("invalidateTags"),
      );
      expect(invalidateCalls).toHaveLength(0);
      expect(mockDispatch).toHaveBeenCalled();
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
      } as unknown as WithCryptoAssetsApi;

      expect(extractHashesFromState(mockState)).toEqual({
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
      } as unknown as WithCryptoAssetsApi;

      expect(extractHashesFromState(mockState)).toEqual({});
    });

    it("should return empty object if no RTK Query state", () => {
      expect(extractHashesFromState({} as unknown as WithCryptoAssetsApi)).toEqual({});
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
      } as unknown as WithCryptoAssetsApi;

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
      } as unknown as WithCryptoAssetsApi;

      const persistedData = extractPersistedCALFromState(mockState);

      expect(persistedData.version).toBe(PERSISTENCE_VERSION);
      expect(persistedData.tokens).toHaveLength(1);
      expect(persistedData.hashes).toBeUndefined();
    });
  });

  describe("integration: token_identifier round-trip", () => {
    const ttl = 24 * 60 * 60 * 1000;

    function makeStore() {
      return configureStore({
        reducer: { [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer },
        middleware: getDefaultMiddleware =>
          getDefaultMiddleware({
            serializableCheck: false,
            thunk: {
              extraArgument: calApiExtra({
                calServiceUrl: "https://cal.test",
                ledgerClientVersion: "1.0.0",
              }),
            },
          }).concat(cryptoAssetsApi.middleware),
      });
    }

    it("should restore cache entry with token_identifier after extract → restore cycle", async () => {
      const sourceState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenByAddressInCurrency({"contract_address":"0xdac17f958d2ee523a2206206994597c13d831ec7","network":"ethereum","token_identifier":"MYTOKEN-abc123"})':
              {
                status: "fulfilled",
                data: mockToken,
                endpointName: "findTokenByAddressInCurrency",
                originalArgs: {
                  contract_address: mockToken.contractAddress,
                  network: mockToken.parentCurrencyId,
                  token_identifier: "MYTOKEN-abc123",
                },
                fulfilledTimeStamp: Date.now(),
              },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      const persisted = extractPersistedCALFromState(sourceState);
      expect(persisted.tokens[0].token_identifier).toBe("MYTOKEN-abc123");

      const newStore = makeStore();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await restoreTokensToCache(newStore.dispatch as any, persisted, ttl);

      const newQueries = newStore.getState()[cryptoAssetsApi.reducerPath].queries;
      const restoredEntry = Object.values(newQueries).find(
        entry =>
          entry?.endpointName === "findTokenByAddressInCurrency" &&
          (entry.originalArgs as { token_identifier?: string } | undefined)?.token_identifier ===
            "MYTOKEN-abc123",
      );
      expect(restoredEntry).toBeDefined();
      expect(restoredEntry?.data).toMatchObject({ id: mockToken.id });
    });

    it("should restore cache entry without token_identifier unchanged after round-trip", async () => {
      const sourceState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"ethereum/erc20/usdt"})': {
              status: "fulfilled",
              data: mockToken,
              endpointName: "findTokenById",
              originalArgs: { id: mockToken.id },
              fulfilledTimeStamp: Date.now(),
            },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      const persisted = extractPersistedCALFromState(sourceState);
      expect(persisted.tokens[0].token_identifier).toBeUndefined();

      const newStore = makeStore();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await restoreTokensToCache(newStore.dispatch as any, persisted, ttl);

      const newQueries = newStore.getState()[cryptoAssetsApi.reducerPath].queries;
      const addressEntry = Object.values(newQueries).find(
        entry => entry?.endpointName === "findTokenByAddressInCurrency",
      );
      expect(addressEntry).toBeDefined();
      expect(
        (addressEntry?.originalArgs as { token_identifier?: string } | undefined)?.token_identifier,
      ).toBeUndefined();
    });

    it("should restore the latest body under every key so the next lookups hit the cache", async () => {
      const trc10Token = token({
        type: "TokenCurrency",
        id: "tron/trc10/1002000",
        contractAddress: "TF5Bn4cJCT6GVeUgyCN4rBhDg42KBrpAjg",
        parentCurrencyId: "tron",
        tokenType: "trc10",
        tokenIdentifier: "1002000",
        name: "BitTorrent Old",
        ticker: "BTTOLD",
        units: [{ name: "BitTorrent Old", code: "BTTOLD", magnitude: 6 }],
      });
      const staleTrc10Token = { ...trc10Token, tokenIdentifier: undefined };
      const sourceState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'findTokenById({"id":"tron/trc10/1002000"})': {
              status: "fulfilled",
              data: staleTrc10Token,
              endpointName: "findTokenById",
              originalArgs: { id: trc10Token.id },
              fulfilledTimeStamp: Date.now() - 1000,
            },
            'findTokenByTokenIdentifierInCurrency({"network":"tron","token_identifier":"1002000"})':
              {
                status: "fulfilled",
                data: trc10Token,
                endpointName: "findTokenByTokenIdentifierInCurrency",
                originalArgs: { token_identifier: "1002000", network: "tron" },
                fulfilledTimeStamp: Date.now(),
              },
          },
        },
      } as unknown as WithCryptoAssetsApi;
      const store = makeStore();
      const fetchSpy = jest.spyOn(globalThis, "fetch");

      try {
        const persisted = parsePersistedCAL(
          JSON.parse(JSON.stringify(extractPersistedCALFromState(sourceState))),
        );
        expect(persisted).not.toBeNull();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await restoreTokensToCache(store.dispatch as any, persisted!, ttl);

        const byIdentifier = await store.dispatch(
          cryptoAssetsApi.endpoints.findTokenByTokenIdentifierInCurrency.initiate({
            token_identifier: "1002000",
            network: "tron",
          }),
        );
        const byId = await store.dispatch(
          cryptoAssetsApi.endpoints.findTokenById.initiate({ id: trc10Token.id }),
        );

        expect(byIdentifier.data).toEqual(trc10Token);
        expect(byId.data).toEqual(trc10Token);
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  describe("persistedCALContentEqual", () => {
    const baseTokenData = mockToken;

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

    it("should return true for same content with different timestamps", () => {
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
      const otherToken = token({
        type: "TokenCurrency",
        id: "ethereum/erc20/usdc",
        contractAddress: "0xa0b8",
        parentCurrencyId: "ethereum",
        tokenType: "erc20",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
      });
      const a: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
      };
      const b: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [
          { data: baseTokenData, timestamp: 1000 },
          { data: otherToken, timestamp: 1000 },
        ],
      };
      expect(persistedCALContentEqual(a, b)).toBe(false);
    });

    it("should return false when token data differs", () => {
      const changedToken = token({ ...mockToken, ticker: "USDC" });
      const a: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
      };
      const b: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: changedToken, timestamp: 1000 }],
      };
      expect(persistedCALContentEqual(a, b)).toBe(false);
    });

    it("should return false when a lookup argument was gained", () => {
      const a: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000 }],
      };
      const withIdentifier: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000, token_identifier: "MYTOKEN-abc123" }],
      };
      const withLookup: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: baseTokenData, timestamp: 1000, token_identifier_lookup: "42" }],
      };
      expect(persistedCALContentEqual(a, withIdentifier)).toBe(false);
      expect(persistedCALContentEqual(a, withLookup)).toBe(false);
    });
  });
});
