import { configureStore } from "@reduxjs/toolkit";
import { swapApi, swapApiExtra, type SwapApiExtra } from "@shared/api-services";
import type { AuthProvider } from "@shared/auth";

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
export function setupStandaloneSwapQuotesStore(extra: SwapApiExtra) {
  const store = configureStore({
    reducer: {
      [swapApi.reducerPath]: swapApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: {
          extraArgument: {
            ...swapApiExtra(extra),
            authProvider: unauthenticatedProvider,
          },
        },
      }).concat(swapApi.middleware),
  });

  setSwapQuotesStore(store.dispatch);

  return store;
}
