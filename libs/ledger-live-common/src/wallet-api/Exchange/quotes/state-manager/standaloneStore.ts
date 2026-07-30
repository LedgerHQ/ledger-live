import { configureStore } from "@reduxjs/toolkit";

import { swapQuotesApi } from "./api";
import { setSwapQuotesStore } from "./store";

/**
 * Create a minimal standalone Redux store for the {@link swapQuotesApi} and
 * register its dispatch via {@link setSwapQuotesStore}.
 *
 * Desktop and mobile call {@link setSwapQuotesStore} with their own app
 * store's dispatch at startup. Headless consumers of `getQuotes` that have no
 * app Redux store — notably wallet-cli — call this instead so `fetchQuotes`
 * has a dispatch to run the endpoint against.
 *
 * @returns The created Redux store (mostly useful for inspection/teardown in tests).
 */
export function setupStandaloneSwapQuotesStore() {
  const store = configureStore({
    reducer: {
      [swapQuotesApi.reducerPath]: swapQuotesApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false }).concat(swapQuotesApi.middleware),
  });

  setSwapQuotesStore(store.dispatch);

  return store;
}
