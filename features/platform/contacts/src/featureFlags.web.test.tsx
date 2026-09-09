import React, { type FC, type ReactNode } from "react";
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
  DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
  isContactsEnabledForCurrency,
  parseEligibleAddressFamiliesInput,
  resolveContactsFeatureConfig,
  resolveContactsFeatureParams,
  updateContactsFeatureValue,
  useContactsFeature,
  type ContactsFeatureConfig,
  type ContactsFeaturePlatform,
  type ContactsFeatureValue,
} from "./featureFlags";

const PLATFORMS: ContactsFeaturePlatform[] = ["desktop", "mobile"];
const DEFAULT_CONFIG: ContactsFeatureConfig = {
  isEnabled: false,
  showNewBadge: false,
  eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
  excludedCurrencyIds: [],
};

function makeContactsFeatureValue(enabled: boolean, newBadge: boolean): ContactsFeatureValue {
  return {
    enabled,
    params: {
      newBadge,
      eligibleAddressFamilies: [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES],
    },
  };
}

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
    expect(resolveContactsFeatureConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it("returns enabled config with a new badge only when the flag and param are enabled", () => {
    expect(resolveContactsFeatureConfig(makeContactsFeatureValue(true, true))).toEqual({
      isEnabled: true,
      showNewBadge: true,
      eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
      excludedCurrencyIds: [],
    });
  });

  it("normalizes eligible address families from the feature value", () => {
    expect(
      resolveContactsFeatureConfig({
        enabled: true,
        params: { newBadge: false, eligibleAddressFamilies: [" EVM ", "bitcoin", "evm"] },
      }),
    ).toEqual({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: ["evm", "bitcoin"],
      excludedCurrencyIds: [],
    });
  });

  it("passes through excludedCurrencyIds from the feature value", () => {
    expect(
      resolveContactsFeatureConfig({
        enabled: true,
        params: {
          newBadge: false,
          eligibleAddressFamilies: ["evm"],
          excludedCurrencyIds: ["ethereum", "bitcoin"],
        },
      }),
    ).toEqual({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
      excludedCurrencyIds: ["ethereum", "bitcoin"],
    });
  });
});

describe("resolveContactsFeatureParams", () => {
  it("falls back to the default families when the configured value is invalid", () => {
    expect(resolveContactsFeatureParams({ eligibleAddressFamilies: ["evm", 1] })).toEqual({
      newBadge: false,
      eligibleAddressFamilies: ["evm"],
      excludedCurrencyIds: [],
    });
  });

  it("falls back to the default families when the configured value is empty", () => {
    expect(resolveContactsFeatureParams({ eligibleAddressFamilies: [] })).toEqual({
      newBadge: false,
      eligibleAddressFamilies: ["evm"],
      excludedCurrencyIds: [],
    });
  });

  it("normalizes excludedCurrencyIds, deduplicating entries", () => {
    expect(
      resolveContactsFeatureParams({ excludedCurrencyIds: ["ethereum", "ethereum", "bitcoin"] }),
    ).toEqual({
      newBadge: false,
      eligibleAddressFamilies: ["evm"],
      excludedCurrencyIds: ["ethereum", "bitcoin"],
    });
  });

  it("falls back to an empty array when excludedCurrencyIds contains non-strings", () => {
    expect(resolveContactsFeatureParams({ excludedCurrencyIds: ["ethereum", 42] })).toEqual({
      newBadge: false,
      eligibleAddressFamilies: ["evm"],
      excludedCurrencyIds: [],
    });
  });
});

describe("isContactsEnabledForCurrency", () => {
  const enabledConfig: ContactsFeatureConfig = {
    isEnabled: true,
    showNewBadge: false,
    eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
    excludedCurrencyIds: ["ethereum"],
  };

  it("returns true when the feature is enabled and the currency is not excluded", () => {
    expect(isContactsEnabledForCurrency(enabledConfig, "bitcoin")).toBe(true);
  });

  it("returns false when the currency is in excludedCurrencyIds", () => {
    expect(isContactsEnabledForCurrency(enabledConfig, "ethereum")).toBe(false);
  });

  it("returns false when the feature is disabled, even if the currency is not excluded", () => {
    expect(isContactsEnabledForCurrency(DEFAULT_CONFIG, "bitcoin")).toBe(false);
  });
});

describe("parseEligibleAddressFamiliesInput", () => {
  it("normalizes a comma-separated input", () => {
    expect(parseEligibleAddressFamiliesInput(" EVM, bitcoin, evm ")).toEqual(["evm", "bitcoin"]);
  });

  it("falls back to the default families for empty input", () => {
    expect(parseEligibleAddressFamiliesInput(" , ")).toEqual(["evm"]);
  });
});

describe("updateContactsFeatureValue", () => {
  it("preserves generic feature metadata", () => {
    expect(
      updateContactsFeatureValue(
        {
          ...makeContactsFeatureValue(true, false),
          desktop_version: "1.0.0",
          languages_whitelisted: ["fr"],
        },
        { params: { newBadge: true } },
      ),
    ).toEqual({
      enabled: true,
      desktop_version: "1.0.0",
      languages_whitelisted: ["fr"],
      params: { newBadge: true, eligibleAddressFamilies: ["evm"], excludedCurrencyIds: [] },
    });
  });

  it("preserves unmodified Contacts params", () => {
    expect(
      updateContactsFeatureValue(makeContactsFeatureValue(true, false), {
        params: { newBadge: true },
      }),
    ).toEqual({
      enabled: true,
      params: { newBadge: true, eligibleAddressFamilies: ["evm"], excludedCurrencyIds: [] },
    });
  });

  it("normalizes an updated eligible address families value", () => {
    expect(
      updateContactsFeatureValue(makeContactsFeatureValue(true, false), {
        params: { eligibleAddressFamilies: ["EVM", "bitcoin", "evm"] },
      }),
    ).toEqual({
      enabled: true,
      params: {
        newBadge: false,
        eligibleAddressFamilies: ["evm", "bitcoin"],
        excludedCurrencyIds: [],
      },
    });
  });

  it("does not copy malformed current params into the override", () => {
    expect(
      updateContactsFeatureValue(
        { enabled: true, params: "invalid" } as unknown as ContactsFeatureValue,
        { params: { newBadge: true } },
      ),
    ).toEqual({
      enabled: true,
      params: { newBadge: true, eligibleAddressFamilies: ["evm"], excludedCurrencyIds: [] },
    });
  });
});

describe("useContactsFeature", () => {
  it.each(PLATFORMS)("returns disabled config on %s with the default registry value", platform => {
    const { result } = renderFeature(platform);

    expectConfig(result, DEFAULT_CONFIG);
  });

  it.each(PLATFORMS)("returns no new badge on %s when the flag is disabled", platform => {
    const { result } = renderFeature(platform, makeContactsFeatureValue(false, true));

    expectConfig(result, DEFAULT_CONFIG);
  });

  it.each(PLATFORMS)("returns enabled without new badge on %s", platform => {
    const { result } = renderFeature(platform, makeContactsFeatureValue(true, false));

    expectConfig(result, {
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
      excludedCurrencyIds: [],
    });
  });

  it.each(PLATFORMS)("returns enabled with new badge on %s", platform => {
    const { result } = renderFeature(platform, makeContactsFeatureValue(true, true));

    expectConfig(result, {
      isEnabled: true,
      showNewBadge: true,
      eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
      excludedCurrencyIds: [],
    });
  });

  it("does not enable mobile when only the desktop flag is enabled", () => {
    const resolved: Features = {
      ...FEATURE_FLAGS_DEFAULTS,
      lwdContacts: makeContactsFeatureValue(true, true),
      lwmContacts: makeContactsFeatureValue(false, false),
    };
    const { Wrapper } = makeStoreWrapper({ resolved });
    const { result } = renderHook(() => useContactsFeature("mobile"), {
      wrapper: Wrapper,
    });

    expectConfig(result, DEFAULT_CONFIG);
  });

  it("does not enable desktop when only the mobile flag is enabled", () => {
    const resolved: Features = {
      ...FEATURE_FLAGS_DEFAULTS,
      lwdContacts: makeContactsFeatureValue(false, false),
      lwmContacts: makeContactsFeatureValue(true, true),
    };
    const { Wrapper } = makeStoreWrapper({ resolved });
    const { result } = renderHook(() => useContactsFeature("desktop"), {
      wrapper: Wrapper,
    });

    expectConfig(result, DEFAULT_CONFIG);
  });

  it("maps each platform to its dedicated feature flag", () => {
    expect(CONTACTS_FEATURE_FLAG_KEYS).toEqual({
      desktop: "lwdContacts",
      mobile: "lwmContacts",
    });
  });
});
