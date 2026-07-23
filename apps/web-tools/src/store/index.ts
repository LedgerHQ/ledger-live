import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { cryptoAssetsApi, calApiExtra } from "@domain/api-currency-token";
import { getEnv } from "@ledgerhq/live-env";

export const store = configureStore({
  reducer: {
    featureFlags: featureFlagsReducer,
    [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: calApiExtra({
          calServiceUrl: getEnv("CAL_SERVICE_URL"),
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
      },
    }).concat(createFeatureFlagsMiddleware({ resolutionConfig: {} }), cryptoAssetsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
