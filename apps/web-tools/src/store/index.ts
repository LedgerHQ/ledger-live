import { combineReducers, configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { withCopyStoreHydration } from "@devtools/protocols/copyStore";
import { sleepingListener } from "./sleepingListener";
import { cryptoAssetsApi, calApiExtra } from "@domain/api-currency-token";
import { getEnv } from "@shared/live-env";

const rootReducer = combineReducers({
  featureFlags: featureFlagsReducer,
  [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
});

export const store = configureStore({
  reducer: withCopyStoreHydration(rootReducer),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: calApiExtra({
          calServiceUrl: getEnv("CAL_SERVICE_URL"),
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
      },
    })
      .prepend(sleepingListener.middleware)
      .concat(createFeatureFlagsMiddleware({ resolutionConfig: {} }), cryptoAssetsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
