import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { setResolutionConfig } from "@shared/feature-flags";

setResolutionConfig({});

export const store = configureStore({
  reducer: {
    featureFlags: featureFlagsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
