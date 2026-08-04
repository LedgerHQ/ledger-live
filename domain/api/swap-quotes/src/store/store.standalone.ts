import { configureStore } from "@reduxjs/toolkit";
import type { AuthProvider } from "@shared/auth";

import { swapQuotesApi, swapQuotesApiExtra } from "../api";
import type { SwapQuotesApiExtra } from "../types";
import { setSwapQuotesStore } from "./store";

// Headless consumers have no session. Yielding no token keeps the request
// unauthenticated without the base query warning on every call.
const unauthenticatedProvider: AuthProvider = {
  withToken: ({ queryFn }) => queryFn(),
};

/**
 * For headless consumers of `getQuotes` that have no app Redux store — notably
 * wallet-cli. Desktop and mobile call {@link setSwapQuotesStore} with their own
 * store's dispatch instead.
 */
export function setupStandaloneSwapQuotesStore(extra: SwapQuotesApiExtra) {
  const store = configureStore({
    reducer: {
      [swapQuotesApi.reducerPath]: swapQuotesApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: {
          extraArgument: {
            ...swapQuotesApiExtra(extra),
            authProvider: unauthenticatedProvider,
          },
        },
      }).concat(swapQuotesApi.middleware),
  });

  setSwapQuotesStore(store.dispatch);

  return store;
}
