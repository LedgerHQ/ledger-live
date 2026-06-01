/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {
  selectFeature,
  featureFlagsOverridesSelector,
  featureFlagsBannerVisibleSelector,
  selectRemoteFlagsHydrated,
} from "./selectors";
import type { FeatureFlagsState } from "./schema";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";

const state: { featureFlags: FeatureFlagsState } = {
  featureFlags: {
    overrides: {
      mockFeature: { enabled: true, params: { color: "blue" } },
    },
    resolved: {
      ...FEATURE_FLAGS_DEFAULTS,
      mockFeature: { enabled: true, params: { color: "blue" } },
    } as FeatureFlagsState["resolved"],
    bannerVisible: false,
    lastRemoteSyncAt: null,
  },
};

describe("feature-flags selectors", () => {
  it("selectFeature returns resolved flag", () => {
    const result = selectFeature(state, "mockFeature");
    expect(result).toEqual({ enabled: true, params: { color: "blue" } });
  });

  it("selectFeature returns disabled default for unresolved keys", () => {
    const result = selectFeature(state, "mixpanelAnalytics");
    expect(result).toEqual(FEATURE_FLAGS_DEFAULTS["mixpanelAnalytics"]);
    expect(result.enabled).toBe(false);
  });

  it("featureFlagsOverridesSelector returns overrides", () => {
    expect(featureFlagsOverridesSelector(state)).toBe(state.featureFlags.overrides);
  });

  it("featureFlagsBannerVisibleSelector returns bannerVisible", () => {
    expect(featureFlagsBannerVisibleSelector(state)).toBe(false);
  });

  it("selectRemoteFlagsHydrated is false when lastRemoteSyncAt is null", () => {
    expect(selectRemoteFlagsHydrated(state)).toBe(false);
  });

  it("selectRemoteFlagsHydrated is true once lastRemoteSyncAt is set", () => {
    const hydrated = {
      featureFlags: { ...state.featureFlags, lastRemoteSyncAt: 1700000000000 },
    };
    expect(selectRemoteFlagsHydrated(hydrated)).toBe(true);
  });
});
