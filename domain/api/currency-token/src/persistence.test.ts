import { configureStore } from "@reduxjs/toolkit";
import type { QueryCacheKey } from "@reduxjs/toolkit/query";
import { token, type TokenCurrency } from "@domain/entity-currency-token";
import { calApiExtra } from "@shared/api-services";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
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

    it("should restore valid tokens to RTK Query cache", () => {
      const mockDispatch = jest.fn();
      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: Date.now() }],
      };

      restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it("should skip expired tokens", () => {
      const mockDispatch = jest.fn();
      const persistedData: PersistedCAL = {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: mockToken, timestamp: Date.now() - 25 * 60 * 60 * 1000 }],
      };

      restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("should restore tokens even when the parent currency is unknown (guard moved to the converter)", () => {
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

      restoreTokensToCache(mockDispatch, persistedData, ttl);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    describe("stored hashes", () => {
      const currenciesUrl = "https://cal.test/v1/currencies";
      const server = setupServer();

      beforeAll(() => {
        server.listen({ onUnhandledRequest: "error" });
      });

      afterEach(() => {
        hashRequests = 0;
        server.resetHandlers();
      });

      afterAll(() => {
        server.close();
      });

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

      type Store = ReturnType<typeof makeStore>;

      function restoredTokenCount(store: Store) {
        return Object.values(store.getState()[cryptoAssetsApi.reducerPath].queries).filter(
          query =>
            query?.endpointName === "findTokenById" ||
            query?.endpointName === "findTokenByAddressInCurrency",
        ).length;
      }

      function tokenCount(store: Store, currencyId: string) {
        return Object.values(store.getState()[cryptoAssetsApi.reducerPath].queries).filter(
          query => {
            if (
              query?.endpointName !== "findTokenById" &&
              query?.endpointName !== "findTokenByAddressInCurrency"
            ) {
              return false;
            }
            const data: unknown = query.data;
            return (
              typeof data === "object" &&
              data !== null &&
              "parentCurrencyId" in data &&
              data.parentCurrencyId === currencyId
            );
          },
        ).length;
      }

      let hashRequests = 0;

      function respond(response: () => Response | Promise<Response>) {
        server.use(
          http.get(currenciesUrl, () => {
            hashRequests += 1;
            return response();
          }),
        );
      }

      async function waitForHashRequests(count: number) {
        for (let attempt = 0; attempt < 50; attempt += 1) {
          if (hashRequests >= count) {
            for (let tick = 0; tick < 5; tick += 1) {
              await new Promise(resolve => setImmediate(resolve));
            }
            return;
          }
          await new Promise(resolve => setImmediate(resolve));
        }
        throw new Error("timed out waiting for the hash check");
      }

      async function waitForStoredHash(store: Store, hash: string) {
        for (let attempt = 0; attempt < 50; attempt += 1) {
          if (extractHashesFromState(store.getState()).ethereum === hash) {
            for (let tick = 0; tick < 5; tick += 1) {
              await new Promise(resolve => setImmediate(resolve));
            }
            return;
          }
          await new Promise(resolve => setImmediate(resolve));
        }
        throw new Error("timed out waiting for the stored hash");
      }

      function holdResponse() {
        let release: (response: Response) => void = () => undefined;
        const pending = new Promise<Response>(resolve => {
          release = resolve;
        });
        return {
          pending,
          release(response: Response) {
            release(response);
          },
        };
      }

      const freshTicker = "USDT-LIVE";
      const tokensUrl = "https://cal.test/v1/tokens";

      function freshTokenResponse() {
        return HttpResponse.json([
          {
            id: mockToken.id,
            contract_address: mockToken.contractAddress,
            standard: mockToken.tokenType,
            decimals: mockToken.units[0].magnitude,
            delisted: mockToken.delisted,
            name: mockToken.name,
            ticker: freshTicker,
            units: mockToken.units,
          },
        ]);
      }

      function changedHashResponse() {
        return HttpResponse.json([{ id: "ethereum" }], {
          headers: { "X-Ledger-Commit": "hash456" },
        });
      }

      function expireRestoredTokenEntries(store: Store) {
        const queries = store.getState()[cryptoAssetsApi.reducerPath].queries;
        for (const [queryCacheKey, query] of Object.entries(queries)) {
          if (
            query?.endpointName !== "findTokenById" &&
            query?.endpointName !== "findTokenByAddressInCurrency"
          ) {
            continue;
          }
          store.dispatch(
            cryptoAssetsApi.internalActions.removeQueryResult({
              queryCacheKey: queryCacheKey as QueryCacheKey,
            }),
          );
        }
      }

      function findTokenByIdEntry(store: Store) {
        return Object.values(store.getState()[cryptoAssetsApi.reducerPath].queries).find(
          query => query?.endpointName === "findTokenById",
        );
      }

      function restore(store: Store, hashes?: Record<string, string>) {
        const persistedData: PersistedCAL = {
          version: PERSISTENCE_VERSION,
          tokens: [{ data: mockToken, timestamp: Date.now() }],
          ...(hashes === undefined ? {} : { hashes }),
        };
        restoreTokensToCache(store.dispatch, persistedData, ttl);
      }

      async function expectRestoredCount(
        count: number,
        hashes: Record<string, string> | undefined,
        response?: () => Response,
        remainingHashes?: Record<string, string>,
      ) {
        if (response) respond(response);
        const store = makeStore();
        try {
          restore(store, hashes);
          if (hashes) await waitForHashRequests(Object.keys(hashes).length);
          else await new Promise(resolve => setImmediate(resolve));
          expect(restoredTokenCount(store)).toBe(count);
          expect(extractHashesFromState(store.getState())).toEqual(remainingHashes ?? hashes ?? {});
        } finally {
          store.dispatch(cryptoAssetsApi.util.resetApiState());
        }
      }

      it("optimistically restores persisted tokens", async () => {
        let release: (response: Response) => void = () => undefined;
        const pending = new Promise<Response>(resolve => {
          release = resolve;
        });
        respond(() => pending);

        const store = makeStore();
        try {
          restore(store, { ethereum: "hash123" });

          expect(restoredTokenCount(store)).toBe(2);
          expect(extractHashesFromState(store.getState())).toEqual({ ethereum: "hash123" });

          let joinedCheckSettled = false;
          void store
            .dispatch(cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum"))
            .then(() => {
              joinedCheckSettled = true;
            });
          await new Promise(resolve => setImmediate(resolve));
          expect(joinedCheckSettled).toBe(false);
        } finally {
          release(HttpResponse.error());
          store.dispatch(cryptoAssetsApi.util.resetApiState());
        }
      });

      it("evicts tokens when the hash changes", async () => {
        await expectRestoredCount(
          0,
          { ethereum: "hash123" },
          () =>
            HttpResponse.json([{ id: "ethereum" }], { headers: { "X-Ledger-Commit": "hash456" } }),
          { ethereum: "hash456" },
        );
      });

      it("keeps a fulfilled lookup that replaced an expired restored token", async () => {
        const hash = holdResponse();
        respond(() => hash.pending);
        server.use(http.get(tokensUrl, () => freshTokenResponse()));

        const store = makeStore();
        let unsubscribe: () => void = () => undefined;
        try {
          restore(store, { ethereum: "hash123" });
          expireRestoredTokenEntries(store);

          const lookup = store.dispatch(
            cryptoAssetsApi.endpoints.findTokenById.initiate({ id: mockToken.id }),
          );
          unsubscribe = () => lookup.unsubscribe();
          await lookup;

          hash.release(changedHashResponse());
          await waitForStoredHash(store, "hash456");

          expect(findTokenByIdEntry(store)?.data).toMatchObject({ ticker: freshTicker });
          expect(extractHashesFromState(store.getState())).toEqual({ ethereum: "hash456" });
        } finally {
          hash.release(HttpResponse.error());
          unsubscribe();
          store.dispatch(cryptoAssetsApi.util.resetApiState());
        }
      });

      it("keeps an in-flight lookup that replaced an expired restored token", async () => {
        const hash = holdResponse();
        const tokenResponse = holdResponse();
        respond(() => hash.pending);
        server.use(http.get(tokensUrl, () => tokenResponse.pending));

        const store = makeStore();
        let unsubscribe: () => void = () => undefined;
        try {
          restore(store, { ethereum: "hash123" });
          expireRestoredTokenEntries(store);

          const lookup = store.dispatch(
            cryptoAssetsApi.endpoints.findTokenById.initiate({ id: mockToken.id }),
          );
          unsubscribe = () => lookup.unsubscribe();
          expect(findTokenByIdEntry(store)?.status).toBe("pending");

          hash.release(changedHashResponse());
          await waitForStoredHash(store, "hash456");
          expect(findTokenByIdEntry(store)?.status).toBe("pending");

          tokenResponse.release(freshTokenResponse());
          await lookup;

          expect(findTokenByIdEntry(store)?.status).toBe("fulfilled");
          expect(findTokenByIdEntry(store)?.data).toMatchObject({ ticker: freshTicker });
        } finally {
          hash.release(HttpResponse.error());
          tokenResponse.release(HttpResponse.error());
          unsubscribe();
          store.dispatch(cryptoAssetsApi.util.resetApiState());
        }
      });

      it("evicts tokens when CAL no longer lists the currency", async () => {
        await expectRestoredCount(0, { ethereum: "hash123" }, () => HttpResponse.json([]), {});
      });

      it("does not evict tokens when the hash matches", async () => {
        await expectRestoredCount(2, { ethereum: "hash123" }, () =>
          HttpResponse.json([{ id: "ethereum" }], { headers: { "X-Ledger-Commit": "hash123" } }),
        );
      });

      it("does not evict tokens when the hash fetch fails", async () => {
        await expectRestoredCount(2, { ethereum: "hash123" }, () => HttpResponse.error());
      });

      it("does not evict tokens when the commit header is missing", async () => {
        await expectRestoredCount(2, { ethereum: "hash123" }, () =>
          HttpResponse.json([{ id: "ethereum" }]),
        );
      });

      it("does not evict tokens when there is no stored hash", async () => {
        await expectRestoredCount(2, undefined);
      });

      it("evicts a changed currency while another currency's check is still hung", async () => {
        const polygonToken: TokenCurrency = token({
          type: "TokenCurrency",
          id: "polygon/erc20/usdt",
          contractAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
          parentCurrencyId: "polygon",
          tokenType: "erc20",
          name: "Tether USD",
          ticker: "USDT",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
        });
        let releaseEthereum: () => void = () => undefined;
        const ethereumPending = new Promise<void>(resolve => {
          releaseEthereum = resolve;
        });
        server.use(
          http.get(currenciesUrl, async ({ request }) => {
            hashRequests += 1;
            const id = new URL(request.url).searchParams.get("id");
            if (id === "ethereum") {
              await ethereumPending;
              return HttpResponse.error();
            }
            return HttpResponse.json([{ id: "polygon" }], {
              headers: { "X-Ledger-Commit": "hash-new" },
            });
          }),
        );

        const store = makeStore();
        try {
          restoreTokensToCache(
            store.dispatch,
            {
              version: PERSISTENCE_VERSION,
              tokens: [
                { data: mockToken, timestamp: Date.now() },
                { data: polygonToken, timestamp: Date.now() },
              ],
              hashes: { ethereum: "hash123", polygon: "hash-old" },
            },
            ttl,
          );

          for (let attempt = 0; attempt < 50 && tokenCount(store, "polygon") !== 0; attempt += 1) {
            await new Promise(resolve => setImmediate(resolve));
          }

          expect(tokenCount(store, "polygon")).toBe(0);
          expect(tokenCount(store, "ethereum")).toBe(2);
          expect(extractHashesFromState(store.getState())).toEqual({
            ethereum: "hash123",
            polygon: "hash-new",
          });
        } finally {
          releaseEthereum();
          store.dispatch(cryptoAssetsApi.util.resetApiState());
        }
      });
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

    it("reads a hash that is still in flight", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'getTokensSyncHash("ethereum")': {
              status: "pending",
              data: "hash123",
              endpointName: "getTokensSyncHash",
            },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      expect(extractHashesFromState(mockState)).toEqual({ ethereum: "hash123" });
    });

    it("reads a hash left behind by a failed refetch", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'getTokensSyncHash("ethereum")': {
              status: "rejected",
              data: "hash123",
              error: { status: "FETCH_ERROR" },
              endpointName: "getTokensSyncHash",
            },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      expect(extractHashesFromState(mockState)).toEqual({ ethereum: "hash123" });
    });

    it("ignores an in-flight hash check that has no cached value", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'getTokensSyncHash("ethereum")': {
              status: "pending",
              endpointName: "getTokensSyncHash",
            },
          },
        },
      } as unknown as WithCryptoAssetsApi;

      expect(extractHashesFromState(mockState)).toEqual({});
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

    it("should restore cache entry with token_identifier after extract → restore cycle", () => {
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
      restoreTokensToCache(newStore.dispatch, persisted, ttl);

      const newQueries = newStore.getState()[cryptoAssetsApi.reducerPath].queries;
      const restoredEntry = Object.values(newQueries).find(
        entry =>
          entry?.endpointName === "findTokenByAddressInCurrency" &&
          (entry.originalArgs as { token_identifier?: string } | undefined)?.token_identifier ===
            "MYTOKEN-abc123",
      );
      expect(restoredEntry).toBeDefined();
      expect(restoredEntry?.data).toMatchObject({ id: mockToken.id });
      newStore.dispatch(cryptoAssetsApi.util.resetApiState());
    });

    it("should restore cache entry without token_identifier unchanged after round-trip", () => {
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
      restoreTokensToCache(newStore.dispatch, persisted, ttl);

      const newQueries = newStore.getState()[cryptoAssetsApi.reducerPath].queries;
      const addressEntry = Object.values(newQueries).find(
        entry => entry?.endpointName === "findTokenByAddressInCurrency",
      );
      expect(addressEntry).toBeDefined();
      expect(
        (addressEntry?.originalArgs as { token_identifier?: string } | undefined)?.token_identifier,
      ).toBeUndefined();
      newStore.dispatch(cryptoAssetsApi.util.resetApiState());
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
  });
});
