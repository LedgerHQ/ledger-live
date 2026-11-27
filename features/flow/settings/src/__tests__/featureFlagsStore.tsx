import React, { type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  FEATURE_FLAGS_DEFAULTS,
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
  type Features,
} from "@shared/feature-flags";

/** A real feature-flags store whose resolved `newSettings` is the given value. */
export function makeFeatureFlagsStore(newSettings?: Features["newSettings"]) {
  const store = configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: {
      featureFlags: {
        ...FEATURE_FLAGS_INITIAL_STATE,
        resolved: { ...FEATURE_FLAGS_DEFAULTS, ...(newSettings ? { newSettings } : {}) },
      },
    },
  });
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <Provider store={store}>{children}</Provider>;
  }
  return { store, Wrapper };
}
