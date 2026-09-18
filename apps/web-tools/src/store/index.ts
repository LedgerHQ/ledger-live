import { combineReducers, configureStore, type UnknownAction } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { withCopyStoreHydration } from "@devtools/protocols/copyStore";
import { sleepingListener } from "./sleepingListener";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { calApiExtra } from "@shared/api-services";
import { getEnv } from "@shared/env";
import {
  getInitialStore,
  importTrustchainStoreState,
  setLkrpEnvironment,
  trustchainHandlers,
  type TrustchainState,
} from "@ledgerhq/ledger-key-ring-protocol/store";

function trustchainReducer(
  state: TrustchainState = getInitialStore(),
  action: UnknownAction,
): TrustchainState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = (trustchainHandlers as any)[action.type];
  return handler ? handler(state, action) : state;
}

const rootReducer = combineReducers({
  featureFlags: featureFlagsReducer,
  trustchain: trustchainReducer,
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

store.dispatch(importTrustchainStoreState());
store.dispatch(setLkrpEnvironment("STAGING"));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
