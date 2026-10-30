import { combineReducers, configureStore, type UnknownAction } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { withCopyStoreHydration } from "@devtools/protocols/copyStore";
import { sleepingListener } from "./sleepingListener";
import { calService, cvsService, defineApiServices } from "@shared/api-services";
import { getEnv } from "@shared/env";
import {
  trustchainHandlers,
  getInitialStore,
  type TrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";

function trustchainReducer(
  state: TrustchainStore = getInitialStore(),
  action: UnknownAction,
): TrustchainStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = (trustchainHandlers as any)[action.type];
  return handler ? handler(state, action) : state;
}

const services = defineApiServices([
  calService(() => ({ calServiceUrl: getEnv("CAL_SERVICE_URL") })),
  cvsService(() => ({ getCountervaluesServiceUrl: () => getEnv("LEDGER_COUNTERVALUES_API") })),
]);

const rootReducer = combineReducers({
  featureFlags: featureFlagsReducer,
  trustchain: trustchainReducer,
  ...services.reducers,
});

export const store = configureStore({
  reducer: withCopyStoreHydration(rootReducer),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: services.createExtra({
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
      },
    })
      .prepend(sleepingListener.middleware)
      .concat(createFeatureFlagsMiddleware({ resolutionConfig: {} }), ...services.middlewares),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
