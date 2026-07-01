import { renderHook } from "@testing-library/react";
import type { Features } from "@shared/feature-flags";
import {
  DUST_FILTERING_FEATURE_FLAG_KEYS,
  useDustFilteringFeature,
  type DustFilteringFeatureConfig,
} from "../useDustFilteringFeature";
import type { WalletPlatform } from "../useWalletFeaturesConfig";
import { FEATURE_FLAGS_DEFAULTS, makeStoreWrapper } from "../../__tests__/renderWithStore";

const PLATFORMS: WalletPlatform[] = ["desktop", "mobile"];

type FlagValue = { enabled: boolean };

function renderFeature(platform: WalletPlatform, flagValue?: FlagValue) {
  const featureFlagKey = DUST_FILTERING_FEATURE_FLAG_KEYS[platform];
  const resolved: Features = {
    ...FEATURE_FLAGS_DEFAULTS,
    ...(flagValue ? { [featureFlagKey]: flagValue } : undefined),
  };
  const { Wrapper } = makeStoreWrapper({ resolved });
  return renderHook(() => useDustFilteringFeature(platform), { wrapper: Wrapper });
}

function expectConfig(result: { current: DustFilteringFeatureConfig }, expected: boolean) {
  expect(result.current.isEnabled).toBe(expected);
}

describe("useDustFilteringFeature hook", () => {
  it.each(PLATFORMS)("returns false on %s with the default registry value", platform => {
    const { result } = renderFeature(platform);

    expectConfig(result, false);
  });

  it.each(PLATFORMS)("returns false on %s when the flag is disabled", platform => {
    const { result } = renderFeature(platform, { enabled: false });

    expectConfig(result, false);
  });

  it.each(PLATFORMS)("returns true on %s when its dedicated flag is enabled", platform => {
    const { result } = renderFeature(platform, { enabled: true });

    expectConfig(result, true);
  });

  it("does not enable mobile when only the desktop flag is enabled", () => {
    const resolved: Features = {
      ...FEATURE_FLAGS_DEFAULTS,
      lwdDustFiltering: { enabled: true },
      lwmDustFiltering: { enabled: false },
    };
    const { Wrapper } = makeStoreWrapper({ resolved });
    const { result } = renderHook(() => useDustFilteringFeature("mobile"), {
      wrapper: Wrapper,
    });

    expectConfig(result, false);
  });

  it("does not enable desktop when only the mobile flag is enabled", () => {
    const resolved: Features = {
      ...FEATURE_FLAGS_DEFAULTS,
      lwdDustFiltering: { enabled: false },
      lwmDustFiltering: { enabled: true },
    };
    const { Wrapper } = makeStoreWrapper({ resolved });
    const { result } = renderHook(() => useDustFilteringFeature("desktop"), {
      wrapper: Wrapper,
    });

    expectConfig(result, false);
  });

  it("maps each platform to its dedicated feature flag", () => {
    expect(DUST_FILTERING_FEATURE_FLAG_KEYS).toEqual({
      desktop: "lwdDustFiltering",
      mobile: "lwmDustFiltering",
    });
  });
});
