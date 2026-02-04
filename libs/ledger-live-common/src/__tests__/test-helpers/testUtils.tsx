import React from "react";
import { Provider } from "react-redux";
import { configureStore, combineReducers, Reducer, Middleware } from "@reduxjs/toolkit";

interface ApiSlice {
  reducerPath: string;
  reducer: Reducer;
  middleware: Middleware;
}

interface CreateTestStoreOptions {
  /** Disable serializable check (e.g. when API stores Date in state) */
  disableSerializableCheck?: boolean;
}

export function createTestStore(apis: ApiSlice[], options?: CreateTestStoreOptions) {
  const reducers: Record<string, Reducer> = {};
  const middlewares: Middleware[] = [];

  apis.forEach(api => {
    reducers[api.reducerPath] = api.reducer;
    middlewares.push(api.middleware);
  });

  return configureStore({
    reducer: combineReducers(reducers),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware(
        options?.disableSerializableCheck ? { serializableCheck: false } : undefined,
      ).concat(middlewares),
  });
}

export function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}
