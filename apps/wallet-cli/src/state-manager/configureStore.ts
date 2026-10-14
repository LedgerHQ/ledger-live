import { configureStore } from "@reduxjs/toolkit";
import { AuthSDK } from "@ledgerhq/auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import { setSwapQuotesStore } from "@domain/api-swap-quotes/store";
import { swapApi, swapApiExtra } from "@shared/api-services";
import { authApiExtra } from "@shared/auth";
import { getEnv } from "@shared/env";
import { loadApiAuthIdentity } from "../key-ring/api-auth-identity";
import { ledgerClientVersion } from "../shared/client-version";
import { createAuthFetch } from "./auth-fetch";

/**
 * Builds the Redux store behind `getQuotes` and registers its dispatch. Called once per CLI run, so
 * the in-memory token and the Keycloak cookie jar never outlive the command.
 */
export function setupWalletCliStore() {
  // Production Keycloak, copied from the deprecated `@shared/env` team-platform definitions. The
  // overrides are for development only and do not change the swap API URL.
  const auth = {
    clientId: process.env.LEDGER_AUTH_CLIENT_ID ?? "ledger-keycloak",
    keycloakBaseUrl:
      process.env.LEDGER_AUTH_KEYCLOAK_BASE_URL ?? "https://global.api.prd.ledger.com/keycloak",
    keycloakRealm: process.env.LEDGER_AUTH_KEYCLOAK_REALM ?? "ledger-bc-customers",
  };
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
              // Same definition as live-common's swap execute/status paths, read on every request.
              getSwapApiBaseUrl: () => getEnv("SWAP_API_BASE"),
              ledgerClientVersion,
            }),
            ...authApiExtra({
              isFeatureEnabled: () => true,
              authProvider: new AuthSDK(
                { ...auth, disablePkce: true },
                {
                  provider: new LkrpIdentityProvider(loadApiAuthIdentity),
                  fetch: createAuthFetch(),
                },
              ),
            }),
          },
        },
      }).concat(swapApi.middleware),
  });

  setSwapQuotesStore(store.dispatch);
}
