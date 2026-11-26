import React, { type ReactNode } from "react";
import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import keyRingReducer, { type KeyRingState } from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { walletSyncSlice } from "@domain/entity-wallet-sync";

/**
 * Renders `hook` with a real store (key ring and wallet sync slices) and a real query client
 * that never retries.
 * `sequence` receives the type of every plain action dispatched, in order.
 */
export function renderLedgerSyncHook<Result, Props>(
  hook: (props: Props) => Result,
  {
    trustchain = mockKeyRingState(),
    sequence = [],
    initialProps,
  }: Readonly<{ trustchain?: KeyRingState; sequence?: string[]; initialProps?: Props }> = {},
) {
  const recorder: Middleware = () => next => action => {
    if (typeof action === "object" && action !== null && "type" in action) {
      sequence.push(String(action.type));
    }
    return next(action);
  };
  const store = configureStore({
    reducer: { trustchain: keyRingReducer, walletSync: walletSyncSlice.reducer },
    preloadedState: { trustchain },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(recorder),
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    );
  }
  const rendered = renderHook(hook, { wrapper: Wrapper, initialProps });
  return { ...rendered, store, queryClient };
}
