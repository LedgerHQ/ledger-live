import { configureStore } from "@reduxjs/toolkit";
import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { token, type TokenCurrency } from "@domain/entity-currency-token";
import { calApiExtra } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import { mockApiTokenResponse } from "./fixtures";
import { HEADER_X_LEDGER_COMMIT, PERSISTENCE_VERSION } from "./internals";
import {
  extractPersistedCALFromState,
  restoreTokensToCache,
  type WithCryptoAssetsApi,
} from "./persistence";
import { SYNC_HASH_BASELINE_REDUCER_PATH, syncHashBaselineReducer } from "./syncHashBaseline";
import type { PersistedCAL } from "./types";

const TTL = 24 * 60 * 60 * 1000;
const OLD_HASH = "old-hash";

function makeToken(parentCurrencyId: string): TokenCurrency {
  return token({
    type: "TokenCurrency",
    id: `${parentCurrencyId}/erc20/usdt`,
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    parentCurrencyId,
    tokenType: "erc20",
    name: "Tether USD",
    ticker: "USDT",
    delisted: false,
    disableCountervalue: false,
    units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
  });
}

const persisted: PersistedCAL = {
  version: PERSISTENCE_VERSION,
  tokens: [
    { data: makeToken("ethereum"), timestamp: Date.now() },
    { data: makeToken("polygon"), timestamp: Date.now() },
  ],
  hashes: { ethereum: OLD_HASH, polygon: OLD_HASH },
};

type HashBehavior = "same" | "changed" | "hang" | "fail";

const behaviors: Record<string, HashBehavior> = {};

const server = setupServer(
  http.get("https://cal.test/v1/currencies", async ({ request }) => {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    const behavior = behaviors[id];
    if (behavior === "hang") await delay("infinite");
    if (behavior === "fail") return new HttpResponse(null, { status: 500 });
    return HttpResponse.json([{ id }], {
      headers: { [HEADER_X_LEDGER_COMMIT]: behavior === "changed" ? "new-hash" : OLD_HASH },
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  for (const key of Object.keys(behaviors)) delete behaviors[key];
});
afterAll(() => server.close());

function makeStore() {
  return configureStore({
    reducer: {
      [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
      [SYNC_HASH_BASELINE_REDUCER_PATH]: syncHashBaselineReducer,
    },
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

/** Simulates a save: the blob a `DBSave` would write for this state. */
function save(store: ReturnType<typeof makeStore>): PersistedCAL {
  return extractPersistedCALFromState(store.getState() as WithCryptoAssetsApi);
}

function fulfilledTokenCurrencies(store: ReturnType<typeof makeStore>): string[] {
  const cached = new Set<string>();
  for (const query of Object.values(store.getState()[cryptoAssetsApi.reducerPath].queries ?? {})) {
    if (
      query?.status === "fulfilled" &&
      (query.endpointName === "findTokenById" ||
        query.endpointName === "findTokenByAddressInCurrency") &&
      query.data &&
      typeof query.data === "object" &&
      "parentCurrencyId" in query.data &&
      typeof query.data.parentCurrencyId === "string"
    ) {
      cached.add(query.data.parentCurrencyId);
    }
  }
  return [...cached].sort();
}

const tick = () => new Promise(resolve => setTimeout(resolve, 50));

describe("restore → save → restart", () => {
  it("keeps the stored hash while the hash checks are pending", async () => {
    behaviors.ethereum = "hang";
    behaviors.polygon = "hang";
    const store = makeStore();

    await restoreTokensToCache(store.dispatch, persisted, TTL);
    await tick();

    const saved = save(store);
    expect(saved.tokens).toHaveLength(2);
    expect(saved.hashes).toEqual({ ethereum: OLD_HASH, polygon: OLD_HASH });
  });

  it("keeps the stored hash when the hash checks fail", async () => {
    behaviors.ethereum = "fail";
    behaviors.polygon = "fail";
    const store = makeStore();

    await restoreTokensToCache(store.dispatch, persisted, TTL);
    await tick();

    expect(save(store).hashes).toEqual({ ethereum: OLD_HASH, polygon: OLD_HASH });
  });

  it("detects the change after a restart from the blob saved during a failed check", async () => {
    behaviors.ethereum = "fail";
    behaviors.polygon = "fail";
    const first = makeStore();
    await restoreTokensToCache(first.dispatch, persisted, TTL);
    await tick();
    const blob = save(first);

    behaviors.ethereum = "changed";
    behaviors.polygon = "changed";
    const second = makeStore();
    await restoreTokensToCache(second.dispatch, blob, TTL);
    await tick();

    expect(save(second).tokens).toHaveLength(0);
  });

  it("never pairs stale tokens with a new hash when one request is fast and changed and one hangs", async () => {
    behaviors.ethereum = "changed";
    behaviors.polygon = "hang";
    const store = makeStore();

    await restoreTokensToCache(store.dispatch, persisted, TTL);
    await tick();

    const saved = save(store);
    expect(saved.tokens.map(entry => entry.data.parentCurrencyId)).toEqual(["polygon"]);
    expect(saved.hashes).toEqual({ ethereum: "new-hash", polygon: OLD_HASH });
  });

  it("should keep a token fetched after a hash change when the same hash is refetched", async () => {
    behaviors.ethereum = "changed";
    behaviors.polygon = "same";
    server.use(
      http.get("https://cal.test/v1/tokens", () => HttpResponse.json([mockApiTokenResponse])),
    );
    const store = makeStore();

    await restoreTokensToCache(store.dispatch, persisted, TTL);
    await store.dispatch(cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum"));
    await store.dispatch(cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("polygon"));
    await tick();

    await store.dispatch(
      cryptoAssetsApi.endpoints.findTokenById.initiate({ id: mockApiTokenResponse.id }),
    );
    await tick();
    await store.dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum", { forceRefetch: true }),
    );

    const saved = save(store);
    const tokenIds = saved.tokens.map(entry => entry.data.id);
    expect(tokenIds).toContain(mockApiTokenResponse.id);
    expect(tokenIds).not.toContain("ethereum/erc20/usdt");
    expect(saved.hashes?.ethereum).toBe("new-hash");
  });

  it("should refresh the token list when a currency hash changes and keep the other currency", async () => {
    behaviors.ethereum = "changed";
    behaviors.polygon = "fail";
    let tokenListRequests = 0;
    server.use(
      http.get("https://cal.test/v1/tokens", () => {
        tokenListRequests += 1;
        return HttpResponse.json([mockApiTokenResponse]);
      }),
    );
    const store = makeStore();
    const list = store.dispatch(cryptoAssetsApi.endpoints.getTokensData.initiate({}));
    await list;
    expect(tokenListRequests).toBe(1);

    await restoreTokensToCache(store.dispatch, persisted, TTL);
    for (let attempt = 0; attempt < 20 && tokenListRequests < 2; attempt += 1) {
      await tick();
    }
    list.unsubscribe();

    expect(tokenListRequests).toBeGreaterThanOrEqual(2);
    const cached = fulfilledTokenCurrencies(store);
    expect(cached).toContain("polygon");
    expect(cached).not.toContain("ethereum");
  });

  it("should keep a failed currency's tokens when another currency's hash changed", async () => {
    behaviors.ethereum = "changed";
    behaviors.polygon = "fail";
    const store = makeStore();

    await restoreTokensToCache(store.dispatch, persisted, TTL);
    await tick();

    expect(fulfilledTokenCurrencies(store)).toEqual(["polygon"]);
  });

  it("keeps all tokens when the hash checks confirm the stored hash", async () => {
    behaviors.ethereum = "same";
    behaviors.polygon = "same";
    const store = makeStore();

    await restoreTokensToCache(store.dispatch, persisted, TTL);
    await tick();

    const saved = save(store);
    expect(saved.tokens).toHaveLength(2);
    expect(saved.hashes).toEqual({ ethereum: OLD_HASH, polygon: OLD_HASH });
  });
});
