import React, { type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  FEATURE_FLAGS_DEFAULTS,
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
  type PartialFeatures,
} from "@shared/feature-flags";

export function createTestWrapper(flags: PartialFeatures) {
  const store = configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: {
      featureFlags: {
        ...FEATURE_FLAGS_INITIAL_STATE,
        resolved: { ...FEATURE_FLAGS_DEFAULTS, ...flags },
      },
    },
  });

  return function TestWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <Provider store={store}>{children}</Provider>;
  };
}
