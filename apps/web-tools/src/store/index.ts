import { configureStore } from "@reduxjs/toolkit";
import { getEnv } from "@ledgerhq/live-env";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { cvsApi, setCvsBaseUrl } from "@domain/api-currencies";
import supportedFiatsReducer from "@features/platform-currencies";

setCvsBaseUrl(getEnv("LEDGER_COUNTERVALUES_API"));

export const store = configureStore({
  reducer: {
    featureFlags: featureFlagsReducer,
    supportedFiats: supportedFiatsReducer,
    [cvsApi.reducerPath]: cvsApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .concat(createFeatureFlagsMiddleware({ resolutionConfig: {} }))
      .concat(cvsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
