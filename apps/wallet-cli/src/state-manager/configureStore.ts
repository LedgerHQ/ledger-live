import { configureStore } from "@reduxjs/toolkit";
import makeFetchCookie from "fetch-cookie";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import { setSwapQuotesStore } from "@domain/api-swap-quotes/store";
import { swapApi, swapApiExtra } from "@shared/api-services";
import { authApiExtra } from "@shared/auth";
import { getEnv } from "@shared/env";
import { loadWalletCliTrustchainStore } from "../key-ring/load-auth-trustchain-store";

export function createWalletCliStore() {
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
            ...authApiExtra({
              isFeatureEnabled: () => true,
              authProvider: new AuthSDK(
                {
                  clientId: getEnv("LEDGER_AUTH_CLIENT_ID"),
                  keycloakBaseUrl: getEnv("LEDGER_AUTH_KEYCLOAK_BASE_URL_PROD"),
                  keycloakRealm: getEnv("LEDGER_AUTH_KEYCLOAK_REALM"),
                  disablePkce: true,
                },
                {
                  provider: new LkrpIdentityProvider(loadWalletCliTrustchainStore),
                  fetch: makeFetchCookie(fetch),
                },
              ),
            }),
          },
        },
      }).concat(swapApi.middleware),
  });

  setSwapQuotesStore(store.dispatch);
  return store;
}
