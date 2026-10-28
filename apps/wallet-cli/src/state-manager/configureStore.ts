import { configureStore } from "@reduxjs/toolkit";
import { setSwapQuotesStore } from "@domain/api-swap-quotes/store";
import { defineApiServices, swapService } from "@shared/api-services";
import { getEnv } from "@shared/env";
import { ledgerClientVersion } from "../shared/client-version";
import { createWalletCliAuthMiddleware } from "./middleware/auth";

const services = defineApiServices([
  // Same definition as live-common's swap execute/status paths, read on every request.
  swapService(() => ({ getSwapApiBaseUrl: () => getEnv("SWAP_API_BASE") })),
]);

/**
 * Builds the Redux store behind `getQuotes` and registers its dispatch. Called once per CLI run, so
 * the in-memory token and the Keycloak cookie jar never outlive the command.
 */
export function setupWalletCliStore() {
  const store = configureStore({
    reducer: { ...services.reducers },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: {
          extraArgument: services.createExtra({ ledgerClientVersion }),
        },
      })
        .concat(createWalletCliAuthMiddleware())
        .concat(services.middlewares),
  });

  setSwapQuotesStore(store.dispatch);
}
