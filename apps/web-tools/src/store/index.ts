import { configureStore } from "@reduxjs/toolkit";
import { getEnv } from "@ledgerhq/live-env";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { cvsApi, cvsApiExtra } from "@domain/api-currencies";
import supportedFiatsReducer from "@features/platform-currencies";

export const store = configureStore({
  reducer: {
    featureFlags: featureFlagsReducer,
    supportedFiats: supportedFiatsReducer,
    [cvsApi.reducerPath]: cvsApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: { extraArgument: cvsApiExtra(getEnv("LEDGER_COUNTERVALUES_API")) },
    })
      .concat(createFeatureFlagsMiddleware({ resolutionConfig: {} }))
      .concat(cvsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
