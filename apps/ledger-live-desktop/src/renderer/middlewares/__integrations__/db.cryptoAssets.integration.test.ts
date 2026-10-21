import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { server } from "tests/server";
import { calApiExtra } from "@shared/api-services";
import { token } from "@domain/entity-currency-token";
import {
  cryptoAssetsApi,
  parsePersistedCAL,
  restoreTokensToCache,
  type PersistedCAL,
} from "@domain/api-currency-token";
import DBMiddleware, { markCryptoAssetsCacheHydrated } from "../db";

const mockSetKey = jest.fn();

jest.mock("~/renderer/storage", () => ({
  setKey: (...args: unknown[]) => mockSetKey(...args),
}));

const realSetTimeout = global.setTimeout;
const SAVE_THROTTLE_MS = 5000;
const TTL = 24 * 60 * 60 * 1000;
const STORED_HASH = "hash123";
const CHANGED_HASH = "hash456";

const usdt = token({
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

function makeStore() {
  return configureStore({
    reducer: { [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
        thunk: {
          extraArgument: calApiExtra({
            calServiceUrl: "https://cal.test",
            ledgerClientVersion: "1.0.0",
          }),
        },
      })
        .concat(cryptoAssetsApi.middleware)
        .concat(DBMiddleware as Middleware),
  });
}

function hashResponse(hash: string) {
  return HttpResponse.json([{ id: "ethereum" }], { headers: { "X-Ledger-Commit": hash } });
}

function holdHashResponse() {
  let release: ((hash: string) => void) | undefined;
  const pending = new Promise<string>(resolve => {
    release = resolve;
  });
  server.use(http.get("https://cal.test/v1/currencies", async () => hashResponse(await pending)));
  return (hash: string) => release?.(hash);
}

function hasCachedUsdt(store: ReturnType<typeof makeStore>) {
  return Object.values(store.getState()[cryptoAssetsApi.reducerPath].queries).some(
    query => query?.endpointName === "findTokenById" && query.data !== undefined,
  );
}

function lastSavedCryptoAssets(): unknown {
  const saves = mockSetKey.mock.calls.filter(([, key]) => key === "cryptoAssets");
  return saves.at(-1)?.[2];
}

async function settle() {
  for (let tick = 0; tick < 10; tick += 1) {
    await new Promise(resolve => realSetTimeout(resolve, 0));
  }
}

describe("DBMiddleware - crypto assets cache with a delayed hash check", () => {
  beforeAll(() => markCryptoAssetsCacheHydrated());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should not restore stale tokens on relaunch when the hash changed after the throttle went idle", async () => {
    const persisted: PersistedCAL = {
      version: 2,
      tokens: [{ data: usdt, timestamp: Date.now() }],
      hashes: { ethereum: STORED_HASH },
    };
    const releaseHash = holdHashResponse();
    const firstLaunch = makeStore();

    restoreTokensToCache(firstLaunch.dispatch, persisted, TTL);
    await settle();
    jest.advanceTimersByTime(SAVE_THROTTLE_MS + 1);

    releaseHash(CHANGED_HASH);
    await settle();
    jest.advanceTimersByTime(SAVE_THROTTLE_MS + 1);

    const saved = parsePersistedCAL(lastSavedCryptoAssets());
    expect(saved?.tokens).toEqual([]);
    expect(saved?.hashes).toEqual({ ethereum: CHANGED_HASH });

    server.use(http.get("https://cal.test/v1/currencies", () => hashResponse(CHANGED_HASH)));
    const relaunch = makeStore();
    if (saved) restoreTokensToCache(relaunch.dispatch, saved, TTL);
    await settle();

    expect(hasCachedUsdt(relaunch)).toBe(false);
  });
});
