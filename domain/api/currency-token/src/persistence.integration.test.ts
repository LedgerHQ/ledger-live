import { configureStore, type Middleware } from "@reduxjs/toolkit";
import type { QueryCacheKey } from "@reduxjs/toolkit/query";
import { CAL_REQUEST_TIMEOUT_MS, calApiExtra } from "@shared/api-services";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { cryptoAssetsApi } from "./api";
import {
  cryptoAssetsState,
  fulfilledTokenQuery,
  persistedCal,
  tokenCurrency,
  usdtToken,
} from "./fixtures";
import {
  extractHashesFromState,
  extractPersistedCALFromState,
  restoreTokensToCache,
} from "./persistence";

const ttl = 24 * 60 * 60 * 1000;
const currenciesUrl = "https://cal.test/v1/currencies";
const tokensUrl = "https://cal.test/v1/tokens";
const freshTicker = "USDT-LIVE";
const usdt = usdtToken();

const server = setupServer();
let hashRequests = 0;

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

function makeStore(afterEachAction: Middleware = () => next => action => next(action)) {
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
      })
        .concat(cryptoAssetsApi.middleware)
        .concat(afterEachAction),
  });
}

type Store = ReturnType<typeof makeStore>;

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

function respond(response: () => Response | Promise<Response>) {
  server.use(
    http.get(currenciesUrl, () => {
      hashRequests += 1;
      return response();
    }),
  );
}

async function waitUntil(predicate: () => boolean) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (predicate()) {
      for (let tick = 0; tick < 5; tick += 1) {
        await new Promise(resolve => setImmediate(resolve));
      }
      return;
    }
    await new Promise(resolve => setImmediate(resolve));
  }
  throw new Error("timed out waiting for the cache to settle");
}

function freshTokenResponse() {
  return HttpResponse.json([
    {
      id: usdt.id,
      contract_address: usdt.contractAddress,
      standard: usdt.tokenType,
      decimals: usdt.units[0].magnitude,
      delisted: usdt.delisted,
      name: usdt.name,
      ticker: freshTicker,
      units: usdt.units,
    },
  ]);
}

function changedHashResponse() {
  return HttpResponse.json([{ id: "ethereum" }], {
    headers: { "X-Ledger-Commit": "hash456" },
  });
}

function restoredTokenCount(store: Store) {
  return Object.values(store.getState()[cryptoAssetsApi.reducerPath].queries).filter(
    query =>
      query?.endpointName === "findTokenById" ||
      query?.endpointName === "findTokenByAddressInCurrency",
  ).length;
}

function tokenCount(store: Store, currencyId: string) {
  return Object.values(store.getState()[cryptoAssetsApi.reducerPath].queries).filter(query => {
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
  }).length;
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
  restoreTokensToCache(
    store.dispatch,
    persistedCal({
      tokens: [usdt],
      timestamp: Date.now(),
      ...(hashes === undefined ? {} : { hashes }),
    }),
    ttl,
  );
}

type StoredHashOutcome = {
  behavior: string;
  restoredCount: number;
  hashes?: Record<string, string>;
  response?: () => Response;
  remainingHashes?: Record<string, string>;
};

describe("restoreTokensToCache", () => {
  describe("stored hashes", () => {
    it("optimistically restores persisted tokens", async () => {
      const hash = holdResponse();
      respond(() => hash.pending);

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
        hash.release(HttpResponse.error());
        store.dispatch(cryptoAssetsApi.util.resetApiState());
      }
    });

    it.each<StoredHashOutcome>([
      {
        behavior: "evicts tokens when the hash changes",
        hashes: { ethereum: "hash123" },
        response: () =>
          HttpResponse.json([{ id: "ethereum" }], { headers: { "X-Ledger-Commit": "hash456" } }),
        restoredCount: 0,
        remainingHashes: { ethereum: "hash456" },
      },
      {
        behavior: "evicts tokens when CAL no longer lists the currency",
        hashes: { ethereum: "hash123" },
        response: () => HttpResponse.json([]),
        restoredCount: 0,
        remainingHashes: {},
      },
      {
        behavior: "does not evict tokens when the hash matches",
        hashes: { ethereum: "hash123" },
        response: () =>
          HttpResponse.json([{ id: "ethereum" }], { headers: { "X-Ledger-Commit": "hash123" } }),
        restoredCount: 2,
      },
      {
        behavior: "does not evict tokens when the hash fetch fails",
        hashes: { ethereum: "hash123" },
        response: () => HttpResponse.error(),
        restoredCount: 2,
      },
      {
        behavior: "does not evict tokens when the commit header is missing",
        hashes: { ethereum: "hash123" },
        response: () => HttpResponse.json([{ id: "ethereum" }]),
        restoredCount: 2,
      },
      {
        behavior: "does not evict tokens when there is no stored hash",
        restoredCount: 2,
      },
    ])("$behavior", async ({ hashes, response, restoredCount, remainingHashes }) => {
      if (response) respond(response);
      const store = makeStore();
      try {
        restore(store, hashes);
        await waitUntil(() => hashes === undefined || hashRequests >= Object.keys(hashes).length);
        expect(restoredTokenCount(store)).toBe(restoredCount);
        expect(extractHashesFromState(store.getState())).toEqual(remainingHashes ?? hashes ?? {});
      } finally {
        store.dispatch(cryptoAssetsApi.util.resetApiState());
      }
    });

    it("never exposes the changed hash next to the stale tokens", async () => {
      respond(changedHashResponse);
      const snapshots: Array<{ hash?: string; tokens: number }> = [];
      // A middleware sees the state after every action; store.subscribe is auto-batched.
      const recordSnapshot: Middleware = api => next => action => {
        const result = next(action);
        snapshots.push({
          hash: extractHashesFromState(api.getState()).ethereum,
          tokens: extractPersistedCALFromState(api.getState()).tokens.length,
        });
        return result;
      };
      const store = makeStore(recordSnapshot);
      try {
        restore(store, { ethereum: "hash123" });
        await waitUntil(() => extractHashesFromState(store.getState()).ethereum === "hash456");

        expect(snapshots.some(({ hash, tokens }) => hash === "hash123" && tokens > 0)).toBe(true);
        expect(snapshots.filter(({ hash, tokens }) => hash === "hash456" && tokens > 0)).toEqual(
          [],
        );
      } finally {
        store.dispatch(cryptoAssetsApi.util.resetApiState());
      }
    });

    it("ends a hung check after the CAL timeout and keeps the stored hash and tokens", async () => {
      jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick", "queueMicrotask"] });
      respond(() => new Promise<Response>(() => undefined));
      const store = makeStore();
      try {
        restore(store, { ethereum: "hash123" });
        await waitUntil(() => hashRequests === 1);

        jest.advanceTimersByTime(CAL_REQUEST_TIMEOUT_MS);
        await waitUntil(
          () =>
            cryptoAssetsApi.endpoints.getTokensSyncHash.select("ethereum")(store.getState())
              .isError,
        );

        const check = cryptoAssetsApi.endpoints.getTokensSyncHash.select("ethereum")(
          store.getState(),
        );
        expect(check.error).toMatchObject({ status: "TIMEOUT_ERROR" });
        expect(hashRequests).toBe(1);
        expect(restoredTokenCount(store)).toBe(2);
        expect(extractHashesFromState(store.getState())).toEqual({ ethereum: "hash123" });
      } finally {
        store.dispatch(cryptoAssetsApi.util.resetApiState());
        jest.useRealTimers();
      }
    });

    it.each([
      { outcome: "succeeds", response: freshTokenResponse, saved: [freshTicker] },
      { outcome: "fails", response: () => HttpResponse.json({}, { status: 404 }), saved: [] },
    ])(
      "keeps an in-place refetch when the hash changes, and saves it only if it $outcome",
      async ({ response, saved }) => {
        const hash = holdResponse();
        const tokenResponse = holdResponse();
        respond(() => hash.pending);
        server.use(http.get(tokensUrl, () => tokenResponse.pending));

        const store = makeStore();
        try {
          restore(store, { ethereum: "hash123" });
          const refetch = store.dispatch(
            cryptoAssetsApi.endpoints.findTokenById.initiate(
              { id: usdt.id },
              { forceRefetch: true },
            ),
          );
          expect(findTokenByIdEntry(store)?.status).toBe("pending");

          hash.release(changedHashResponse());
          await waitUntil(() => extractHashesFromState(store.getState()).ethereum === "hash456");
          expect(findTokenByIdEntry(store)?.status).toBe("pending");

          tokenResponse.release(response());
          await refetch;
          refetch.unsubscribe();

          const tickers = extractPersistedCALFromState(store.getState()).tokens.map(
            ({ data }) => data.ticker,
          );
          expect(tickers).toEqual(saved);
        } finally {
          hash.release(HttpResponse.error());
          tokenResponse.release(HttpResponse.error());
          store.dispatch(cryptoAssetsApi.util.resetApiState());
        }
      },
    );

    it("refreshes a cached token list when the hash changes", async () => {
      let listRequests = 0;
      server.use(
        http.get(tokensUrl, () => {
          listRequests += 1;
          return HttpResponse.json([]);
        }),
      );
      const hash = holdResponse();
      respond(() => hash.pending);

      const store = makeStore();
      const list = store.dispatch(cryptoAssetsApi.endpoints.getTokensData.initiate({}));
      try {
        await list;
        expect(listRequests).toBe(1);

        restore(store, { ethereum: "hash123" });
        hash.release(changedHashResponse());

        await waitUntil(() => listRequests === 2);
        expect(listRequests).toBe(2);
      } finally {
        hash.release(HttpResponse.error());
        list.unsubscribe();
        store.dispatch(cryptoAssetsApi.util.resetApiState());
      }
    });

    it("keeps the stored hash after a failed check outlives the unused-data period", async () => {
      jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick", "queueMicrotask"] });
      respond(() => HttpResponse.json({}, { status: 404 }));
      const store = makeStore();
      try {
        restore(store, { ethereum: "hash123" });
        await waitUntil(
          () =>
            cryptoAssetsApi.endpoints.getTokensSyncHash.select("ethereum")(store.getState())
              .isError,
        );

        jest.advanceTimersByTime(61_000);
        await waitUntil(() => true);

        expect(extractHashesFromState(store.getState())).toEqual({ ethereum: "hash123" });
      } finally {
        store.dispatch(cryptoAssetsApi.util.resetApiState());
        jest.useRealTimers();
      }
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
          cryptoAssetsApi.endpoints.findTokenById.initiate({ id: usdt.id }),
        );
        unsubscribe = () => lookup.unsubscribe();
        await lookup;

        hash.release(changedHashResponse());
        await waitUntil(() => extractHashesFromState(store.getState()).ethereum === "hash456");

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
          cryptoAssetsApi.endpoints.findTokenById.initiate({ id: usdt.id }),
        );
        unsubscribe = () => lookup.unsubscribe();
        expect(findTokenByIdEntry(store)?.status).toBe("pending");

        hash.release(changedHashResponse());
        await waitUntil(() => extractHashesFromState(store.getState()).ethereum === "hash456");
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

    it("evicts a changed currency while another currency's check is still hung", async () => {
      const polygonToken = tokenCurrency({
        id: "polygon/erc20/usdt",
        contractAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        parentCurrencyId: "polygon",
      });
      const ethereum = holdResponse();
      server.use(
        http.get(currenciesUrl, async ({ request }) => {
          hashRequests += 1;
          const id = new URL(request.url).searchParams.get("id");
          if (id === "ethereum") {
            await ethereum.pending;
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
          persistedCal({
            tokens: [usdt, polygonToken],
            hashes: { ethereum: "hash123", polygon: "hash-old" },
            timestamp: Date.now(),
          }),
          ttl,
        );

        await waitUntil(() => tokenCount(store, "polygon") === 0);

        expect(tokenCount(store, "polygon")).toBe(0);
        expect(tokenCount(store, "ethereum")).toBe(2);
        expect(extractHashesFromState(store.getState())).toEqual({
          ethereum: "hash123",
          polygon: "hash-new",
        });
      } finally {
        ethereum.release(HttpResponse.error());
        store.dispatch(cryptoAssetsApi.util.resetApiState());
      }
    });
  });
});

describe("token_identifier round-trip", () => {
  it("should restore cache entry with token_identifier after extract → restore cycle", () => {
    const persisted = extractPersistedCALFromState(
      cryptoAssetsState({
        queries: {
          ...fulfilledTokenQuery(usdt, {
            endpoint: "findTokenByAddressInCurrency",
            tokenIdentifier: "MYTOKEN-abc123",
          }),
        },
      }),
    );
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
    expect(restoredEntry?.data).toMatchObject({ id: usdt.id });
    newStore.dispatch(cryptoAssetsApi.util.resetApiState());
  });

  it("should restore cache entry without token_identifier unchanged after round-trip", () => {
    const persisted = extractPersistedCALFromState(
      cryptoAssetsState({
        queries: { ...fulfilledTokenQuery(usdt, { originalArgs: { id: usdt.id } }) },
      }),
    );
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
