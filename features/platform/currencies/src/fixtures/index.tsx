// Test-only helpers (a Redux store wrapper for the feature-flag hooks).
// Not re-exported from the package barrel; imported only by `*.test.tsx`.
import { type FC, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
  type FeatureFlagsState,
} from "@shared/feature-flags";

export const makeStoreWrapper = (overrides?: Partial<FeatureFlagsState>) => {
  const store = configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: {
      featureFlags: { ...FEATURE_FLAGS_INITIAL_STATE, ...overrides },
    },
  });
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, Wrapper };
};
