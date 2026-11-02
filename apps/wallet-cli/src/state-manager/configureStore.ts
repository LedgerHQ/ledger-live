import { configureStore } from "@reduxjs/toolkit";
import { setSwapQuotesStore } from "@domain/api-swap-quotes/store";
import { swapApi, swapApiExtra } from "@shared/api-services";
import { getEnv } from "@shared/env";
import { ledgerClientVersion } from "../shared/client-version";
import { createWalletCliAuthMiddleware } from "./middleware/auth";

/**
 * Builds the Redux store behind `getQuotes` and registers its dispatch. Called once per CLI run, so
 * the in-memory token and the Keycloak cookie jar never outlive the command.
 */
export function setupWalletCliStore() {
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
          },
        },
      })
        .concat(createWalletCliAuthMiddleware())
        .concat(swapApi.middleware),
  });

  setSwapQuotesStore(store.dispatch);
}
