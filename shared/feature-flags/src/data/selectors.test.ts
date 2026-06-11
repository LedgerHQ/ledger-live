/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {
  selectFeature,
  featureFlagsOverridesSelector,
  featureFlagsBannerVisibleSelector,
  selectRemoteFlagsReady,
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
    remoteFlagsReady: false,
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

  it("selectRemoteFlagsReady returns remoteFlagsReady", () => {
    expect(selectRemoteFlagsReady(state)).toBe(false);
    expect(selectRemoteFlagsReady({ featureFlags: { ...state.featureFlags, remoteFlagsReady: true } })).toBe(
      true,
    );
  });
});
