import { type FC, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import {
  FEATURE_FLAGS_DEFAULTS,
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
  type FeatureFlagsState,
  type Features,
} from "@shared/feature-flags";
import {
  CONTACTS_FEATURE_FLAG_KEYS,
  resolveContactsFeatureConfig,
  useContactsFeature,
  type ContactsFeatureConfig,
  type ContactsFeaturePlatform,
  type ContactsFeatureValue,
} from "./featureFlags";

const PLATFORMS: ContactsFeaturePlatform[] = ["desktop", "mobile"];

function makeStoreWrapper(overrides?: Partial<FeatureFlagsState>) {
  const store = configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: {
      featureFlags: { ...FEATURE_FLAGS_INITIAL_STATE, ...overrides },
    },
  });
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { Wrapper };
}

function renderFeature(platform: ContactsFeaturePlatform, flagValue?: ContactsFeatureValue) {
  const featureFlagKey = CONTACTS_FEATURE_FLAG_KEYS[platform];
  const resolved: Features = {
    ...FEATURE_FLAGS_DEFAULTS,
    ...(flagValue ? { [featureFlagKey]: flagValue } : undefined),
  };
  const { Wrapper } = makeStoreWrapper({ resolved });

  return renderHook(() => useContactsFeature(platform), { wrapper: Wrapper });
}

function expectConfig(result: { current: ContactsFeatureConfig }, expected: ContactsFeatureConfig) {
  expect(result.current).toEqual(expected);
}

describe("resolveContactsFeatureConfig", () => {
  it("returns disabled config without a feature value", () => {
    expect(resolveContactsFeatureConfig(null)).toEqual({
      isEnabled: false,
      showNewBadge: false,
    });
  });

  it("returns enabled config with a new badge only when the flag and param are enabled", () => {
    expect(resolveContactsFeatureConfig({ enabled: true, params: { newBadge: true } })).toEqual({
      isEnabled: true,
      showNewBadge: true,
    });
  });
});

describe("useContactsFeature", () => {
  it.each(PLATFORMS)("returns disabled config on %s with the default registry value", platform => {
    const { result } = renderFeature(platform);

    expectConfig(result, { isEnabled: false, showNewBadge: false });
  });

  it.each(PLATFORMS)("returns no new badge on %s when the flag is disabled", platform => {
    const { result } = renderFeature(platform, { enabled: false, params: { newBadge: true } });

    expectConfig(result, { isEnabled: false, showNewBadge: false });
  });

  it.each(PLATFORMS)("returns enabled without new badge on %s", platform => {
    const { result } = renderFeature(platform, { enabled: true, params: { newBadge: false } });

    expectConfig(result, { isEnabled: true, showNewBadge: false });
  });

  it.each(PLATFORMS)("returns enabled with new badge on %s", platform => {
    const { result } = renderFeature(platform, { enabled: true, params: { newBadge: true } });

    expectConfig(result, { isEnabled: true, showNewBadge: true });
  });

  it("does not enable mobile when only the desktop flag is enabled", () => {
    const resolved: Features = {
      ...FEATURE_FLAGS_DEFAULTS,
      lwdContacts: { enabled: true, params: { newBadge: true } },
      lwmContacts: { enabled: false, params: { newBadge: false } },
    };
    const { Wrapper } = makeStoreWrapper({ resolved });
    const { result } = renderHook(() => useContactsFeature("mobile"), {
      wrapper: Wrapper,
    });

    expectConfig(result, { isEnabled: false, showNewBadge: false });
  });

  it("does not enable desktop when only the mobile flag is enabled", () => {
    const resolved: Features = {
      ...FEATURE_FLAGS_DEFAULTS,
      lwdContacts: { enabled: false, params: { newBadge: false } },
      lwmContacts: { enabled: true, params: { newBadge: true } },
    };
    const { Wrapper } = makeStoreWrapper({ resolved });
    const { result } = renderHook(() => useContactsFeature("desktop"), {
      wrapper: Wrapper,
    });

    expectConfig(result, { isEnabled: false, showNewBadge: false });
  });

  it("maps each platform to its dedicated feature flag", () => {
    expect(CONTACTS_FEATURE_FLAG_KEYS).toEqual({
      desktop: "lwdContacts",
      mobile: "lwmContacts",
    });
  });
});
