import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";

export const store = configureStore({
  reducer: {
    featureFlags: featureFlagsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(createFeatureFlagsMiddleware({ resolutionConfig: {} })),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
