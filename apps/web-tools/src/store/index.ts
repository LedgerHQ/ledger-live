import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { cvsApi } from "@domain/api-currencies";
import supportedFiatsReducer from "@features/platform-currencies";

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
