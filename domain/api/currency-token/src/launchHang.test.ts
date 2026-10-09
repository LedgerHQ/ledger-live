import { configureStore } from "@reduxjs/toolkit";
import { http } from "msw";
import { setupServer } from "msw/node";
import { token } from "@domain/entity-currency-token";
import { calApiExtra } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import { PERSISTENCE_VERSION } from "./internals";
import { restoreTokensToCache } from "./persistence";
import type { PersistedCAL } from "./types";

// LIVE-38959: reproduces the launch hang when CAL accepts the connection but never answers.
// Desktop (renderer/init.tsx) and mobile (LedgerStore.tsx) both `await restoreTokensToCache(...)`
// before finishing startup, so a stalled CAL holds the splash.

const CAL_URL = "https://cal.test";
const TTL = 24 * 60 * 60 * 1000;
const HANG_DEADLINE_MS = 500;

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

// A stored hash is what triggers the getTokensSyncHash call on launch.
const persisted: PersistedCAL = {
  version: PERSISTENCE_VERSION,
  tokens: [{ data: usdt, timestamp: Date.now() }],
  hashes: { ethereum: "stored-hash" },
};

const server = setupServer(http.get(`${CAL_URL}/v1/currencies`, () => new Promise<never>(() => {})));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("restoreTokensToCache when CAL never responds", () => {
  // Documents the bug. Switch to `it` once getTokensSyncHash has a timeout.
  it.failing("settles within a bounded time", async () => {
    const store = configureStore({
      reducer: { [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: calApiExtra({
              calServiceUrl: CAL_URL,
              ledgerClientVersion: "1.2.3",
            }),
          },
        }).concat(cryptoAssetsApi.middleware),
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const outcome = await Promise.race([
      restoreTokensToCache(store.dispatch, persisted, TTL).then(() => "settled"),
      new Promise<string>(resolve => {
        timer = setTimeout(() => resolve("hung"), HANG_DEADLINE_MS);
      }),
    ]);
    clearTimeout(timer);

    expect(outcome).toBe("settled");
  });
});
