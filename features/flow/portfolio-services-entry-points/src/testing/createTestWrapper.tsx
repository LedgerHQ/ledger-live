import React, { type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  FEATURE_FLAGS_DEFAULTS,
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
  type PartialFeatures,
} from "@shared/feature-flags";
import { I18nTestProvider } from "@shared/i18n/testing";

type WalletFlag = { enabled: boolean; params?: { assetSection: boolean } };

function withAssetSection<T extends WalletFlag>(flag: T, assetSection: boolean): T {
  return { ...flag, enabled: true, params: flag.params && { ...flag.params, assetSection } };
}

export function createTestWrapper(flags: PartialFeatures, { isAssetSectionDisplayed = true } = {}) {
  const store = configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: {
      featureFlags: {
        ...FEATURE_FLAGS_INITIAL_STATE,
        resolved: {
          ...FEATURE_FLAGS_DEFAULTS,
          lwdWallet40: FEATURE_FLAGS_DEFAULTS.lwdWallet40,
          lwmWallet40: withAssetSection(
            FEATURE_FLAGS_DEFAULTS.lwmWallet40,
            isAssetSectionDisplayed,
          ),
          ...flags,
        },
      },
    },
  });

  return function TestWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <Provider store={store}>
        <I18nTestProvider>{children}</I18nTestProvider>
      </Provider>
    );
  };
}
