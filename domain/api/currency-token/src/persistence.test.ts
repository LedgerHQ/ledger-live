import { configureStore } from "@reduxjs/toolkit";
import { token, type TokenCurrency } from "@domain/entity-currency-token";
import { calApi, calApiExtra } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import { PERSISTENCE_VERSION, UNCHECKED_TOKEN_TTL } from "./internals";
import {
  extractTokensFromState,
  extractHashesFromState,
  extractPersistedCALFromState,
  persistedCALContentEqual,
  restoreTokensToCache,
  parsePersistedCAL,
  type WithCryptoAssetsApi,
} from "./persistence";
import { type PersistedCAL } from "./types";

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

/** A store wired the way the apps wire it: the CAL service api, with the CAL configuration. */
function makeCalStore() {
  return configureStore({
    reducer: { [calApi.reducerPath]: calApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: {
          extraArgument: calApiExtra({
            calServiceUrl: "https://cal.test",
            ledgerClientVersion: "1.0.0",
          }),
        },
      }).concat(calApi.middleware),
  });
}

type CalStore = ReturnType<typeof makeCalStore>;

function persistedToken(timestamp: number, hashes?: Record<string, string>): PersistedCAL {
  return {
    version: PERSISTENCE_VERSION,
    tokens: [{ data: mockToken, timestamp }],
    ...(hashes && { hashes }),
  };
}

/** A CAL `/v1/currencies` answer for ethereum, carrying `commit` as the sync hash. */
function commitResponse(commit: string): Response {
  return new Response(JSON.stringify([{ id: "ethereum" }]), {
    headers: { "Content-Type": "application/json", "X-Ledger-Commit": commit },
  });
}

function hashCheckStatus(store: CalStore) {
  return store.getState()[calApi.reducerPath].queries['getTokensSyncHash("ethereum")']?.status;
}

/** Waits for the background hash check of ethereum, then for the eviction it can start. */
async function settleHashCheck(store: CalStore) {
  await store.dispatch(cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum"));
  await new Promise(resolve => setTimeout(resolve, 0));
}

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

  describe("restoreTokensToCache", () => {
    const storedHash = "commit-before";
    let fetchSpy: jest.SpyInstance | undefined;

    afterEach(() => {
      jest.useRealTimers();
      fetchSpy?.mockRestore();
      fetchSpy = undefined;
    });

    it("should restore the tokens and the stored hash before the hash check answers", async () => {
      let answer: ((response: Response) => void) | undefined;
      fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(
        () =>
          new Promise(resolve => {
            answer = resolve;
          }),
      );
      const store = makeCalStore();

      restoreTokensToCache(store.dispatch, persistedToken(Date.now(), { ethereum: storedHash }));

      expect(hashCheckStatus(store)).toBe("pending");
      const saved = extractPersistedCALFromState(store.getState());
      expect(saved.tokens.map(entry => entry.data.id)).toEqual([mockToken.id]);
      expect(saved.hashes).toEqual({ ethereum: storedHash });

      answer?.(commitResponse(storedHash));
      await settleHashCheck(store);
    });

    it("should keep the tokens when the hash is unchanged", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => Promise.resolve(commitResponse(storedHash)));
      const store = makeCalStore();

      restoreTokensToCache(store.dispatch, persistedToken(Date.now(), { ethereum: storedHash }));
      await settleHashCheck(store);

      const saved = extractPersistedCALFromState(store.getState());
      expect(saved.tokens).toHaveLength(1);
      expect(saved.hashes).toEqual({ ethereum: storedHash });
    });

    it("should evict the tokens and keep the new hash when the hash changed", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => Promise.resolve(commitResponse("commit-after")));
      const store = makeCalStore();

      restoreTokensToCache(store.dispatch, persistedToken(Date.now(), { ethereum: storedHash }));
      await settleHashCheck(store);

      const saved = extractPersistedCALFromState(store.getState());
      expect(saved.tokens).toHaveLength(0);
      expect(saved.hashes).toEqual({ ethereum: "commit-after" });
    });

    it("should keep the tokens and the stored hash when the hash check fails", async () => {
      jest.useFakeTimers();
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() =>
          Promise.resolve(
            new Response("{}", { status: 503, headers: { "Content-Type": "application/json" } }),
          ),
        );
      const store = makeCalStore();

      restoreTokensToCache(store.dispatch, persistedToken(Date.now(), { ethereum: storedHash }));
      // Long enough for the retries, shorter than the 60 s after which RTK drops unused entries.
      await jest.advanceTimersByTimeAsync(10_000);

      expect(hashCheckStatus(store)).toBe("rejected");
      const saved = extractPersistedCALFromState(store.getState());
      expect(saved.tokens).toHaveLength(1);
      expect(saved.hashes).toEqual({ ethereum: storedHash });
    });

    it("should restore a token of any age when its currency has a stored hash", async () => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => Promise.resolve(commitResponse(storedHash)));
      const store = makeCalStore();

      restoreTokensToCache(
        store.dispatch,
        persistedToken(Date.now() - 2 * UNCHECKED_TOKEN_TTL, { ethereum: storedHash }),
      );
      await settleHashCheck(store);

      expect(extractTokensFromState(store.getState())).toHaveLength(1);
    });

    it("should skip a token older than UNCHECKED_TOKEN_TTL when its currency has no stored hash", () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("unexpected"));
      const store = makeCalStore();

      restoreTokensToCache(store.dispatch, persistedToken(Date.now() - 2 * UNCHECKED_TOKEN_TTL));

      expect(extractTokensFromState(store.getState())).toHaveLength(0);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should restore a recent token without a stored hash, with no hash check", () => {
      fetchSpy = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("unexpected"));
      const store = makeCalStore();

      restoreTokensToCache(store.dispatch, persistedToken(Date.now()));

      const saved = extractPersistedCALFromState(store.getState());
      expect(saved.tokens).toHaveLength(1);
      expect(saved.hashes).toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should restore tokens even when the parent currency is unknown (guard moved to the converter)", () => {
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
      const store = makeCalStore();

      restoreTokensToCache(store.dispatch, {
        version: PERSISTENCE_VERSION,
        tokens: [{ data: orphanToken, timestamp: Date.now() }],
      });

      expect(extractTokensFromState(store.getState())).toHaveLength(1);
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

    it("should keep the last hash of a check that is pending or failed", () => {
      const mockState = {
        [cryptoAssetsApi.reducerPath]: {
          queries: {
            'getTokensSyncHash("ethereum")': {
              status: "pending",
              data: "hash123",
              endpointName: "getTokensSyncHash",
            },
            'getTokensSyncHash("polygon")': {
              status: "rejected",
              data: "hash456",
              endpointName: "getTokensSyncHash",
            },
            'getTokensSyncHash("tron")': {
              status: "rejected",
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
      restoreTokensToCache(newStore.dispatch, persisted);

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
      restoreTokensToCache(newStore.dispatch, persisted);

      const newQueries = newStore.getState()[cryptoAssetsApi.reducerPath].queries;
      const addressEntry = Object.values(newQueries).find(
        entry => entry?.endpointName === "findTokenByAddressInCurrency",
      );
      expect(addressEntry).toBeDefined();
      expect(
        (addressEntry?.originalArgs as { token_identifier?: string } | undefined)?.token_identifier,
      ).toBeUndefined();
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
