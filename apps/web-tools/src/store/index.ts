import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer from "@shared/feature-flags";

export const store = configureStore({
  reducer: {
    featureFlags: featureFlagsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
