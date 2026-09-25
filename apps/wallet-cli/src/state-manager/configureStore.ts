import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import makeFetchCookie from "fetch-cookie";
import { AuthSDK } from "@ledgerhq/auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import { setSwapQuotesStore } from "@domain/api-swap-quotes/store";
import { swapApi, swapApiExtra } from "@shared/api-services";
import { getEnv } from "@shared/env";
import { loadApiAuthIdentity } from "../key-ring/api-auth-identity";

// A stalled auth call must fail fast, so the shared base query can still send the quote.
const AUTH_REQUEST_TIMEOUT_MS = 10_000;
let authRequestTimeoutMs = AUTH_REQUEST_TIMEOUT_MS;

/** @internal Test seam — shortens the auth timeout; `null` restores it. */
export function _setTestAuthRequestTimeoutMs(ms: number | null): void {
  authRequestTimeoutMs = ms ?? AUTH_REQUEST_TIMEOUT_MS;
}

// LKRP sends its OIDC calls through live-network's axios, which only times out GETs.
axios.interceptors.request.use(config => {
  if (!config.timeout && config.url?.includes("/openid/v1/")) {
    config.timeout = authRequestTimeoutMs;
  }
  return config;
});

/**
 * Builds the Redux store behind `getQuotes` and registers its dispatch. Called once per CLI run, so
 * the in-memory token and the Keycloak cookie jar never outlive the command.
 */
export function setupWalletCliStore() {
  // Keycloak keeps its auth session in a cookie across the challenge redirect, which Bun's fetch
  // does not persist. `globalThis.fetch` is resolved per call so a fetch patched after startup
  // (test interceptors) is still used.
  const cookieFetch = makeFetchCookie((input: RequestInfo | URL, init?: RequestInit) =>
    globalThis.fetch(input, init),
  );
  // Loaded once per run, so re-authenticating after a 401 signs with the same key, even a one-off one.
  let identity: ReturnType<typeof loadApiAuthIdentity> | undefined;
  const authProvider = new AuthSDK(
    {
      clientId: getEnv("LEDGER_AUTH_CLIENT_ID"),
      keycloakBaseUrl: getEnv("LEDGER_AUTH_KEYCLOAK_BASE_URL_PROD"),
      keycloakRealm: getEnv("LEDGER_AUTH_KEYCLOAK_REALM"),
      disablePkce: true,
    },
    {
      provider: new LkrpIdentityProvider(() => (identity ??= loadApiAuthIdentity())),
      // Set outside the cookie jar, so the redirect hops share one deadline.
      fetch: (input, init) =>
        cookieFetch(input, { ...init, signal: AbortSignal.timeout(authRequestTimeoutMs) }),
    },
  );

  const store = configureStore({
    reducer: {
      [swapApi.reducerPath]: swapApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: {
          extraArgument: {
            ...swapApiExtra({
              swapApiBaseUrl: getEnv("SWAP_API_BASE"),
              ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
            }),
            authProvider,
          },
        },
      }).concat(swapApi.middleware),
  });

  setSwapQuotesStore(store.dispatch);
}
