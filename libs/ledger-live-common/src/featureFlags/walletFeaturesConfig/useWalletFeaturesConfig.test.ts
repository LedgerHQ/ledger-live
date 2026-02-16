/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import type { Feature, FeatureId } from "@ledgerhq/types-live";
import { useWalletFeaturesConfig } from "./useWalletFeaturesConfig";
import { makeMockedFeatureFlagsProviderWrapper, makeMockedContextValue } from "../mock";
import type { WalletPlatform, WalletFeaturesConfig, Wallet40Params } from "./types";

type MockedFeatures = Partial<Record<FeatureId, Feature>>;

const PLATFORMS: [WalletPlatform, string][] = [
  ["desktop", "lwdWallet40"],
  ["mobile", "lwmWallet40"],
];

const createFeatureFlag = (enabled: boolean, params?: Wallet40Params) => ({
  enabled,
  ...(params && { params }),
});

const renderWalletFeaturesConfig = (platform: WalletPlatform, mockedFeatures: MockedFeatures) =>
  renderHook(() => useWalletFeaturesConfig(platform), {
    wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
  });

const expectConfig = (
  result: { current: WalletFeaturesConfig },
  expected: WalletFeaturesConfig,
) => {
  expect(result.current).toEqual(expected);
};

const DISABLED_CONFIG: WalletFeaturesConfig = {
  isEnabled: false,
  shouldDisplayMarketBanner: false,
  shouldDisplayGraphRework: false,
  shouldDisplayQuickActionCtas: false,
  shouldDisplayNewReceiveDialog: false,
  shouldDisplayWallet40MainNav: false,
  shouldUseLazyOnboarding: false,
};

const ENABLED_NO_PARAMS_CONFIG: WalletFeaturesConfig = {
  isEnabled: true,
  shouldDisplayMarketBanner: false,
  shouldDisplayGraphRework: false,
  shouldDisplayQuickActionCtas: false,
  shouldDisplayNewReceiveDialog: false,
  shouldDisplayWallet40MainNav: false,
  shouldUseLazyOnboarding: false,
};

const ALL_ENABLED_CONFIG: WalletFeaturesConfig = {
  isEnabled: true,
  shouldDisplayMarketBanner: true,
  shouldDisplayGraphRework: true,
  shouldDisplayQuickActionCtas: true,
  shouldDisplayNewReceiveDialog: true,
  shouldDisplayWallet40MainNav: true,
  shouldUseLazyOnboarding: true,
};

const ALL_PARAMS_ENABLED: Wallet40Params = {
  marketBanner: true,
  graphRework: true,
  quickActionCtas: true,
  newReceiveDialog: true,
  mainNavigation: true,
  lazyOnboarding: true,
};

describe("useWalletFeaturesConfig hook", () => {
  describe("when feature flag is disabled", () => {
    it.each(PLATFORMS)(
      "should return all features as false for %s when %s is disabled",
      (platform, flagKey) => {
        const { result } = renderWalletFeaturesConfig(platform, {
          [flagKey]: createFeatureFlag(false, ALL_PARAMS_ENABLED),
        });

        expectConfig(result, DISABLED_CONFIG);
      },
    );

    it.each(PLATFORMS)(
      "should return all features as false for %s when feature flag is not defined",
      platform => {
        const { result } = renderWalletFeaturesConfig(platform, {});

        expectConfig(result, DISABLED_CONFIG);
      },
    );
  });

  describe("when feature flag is enabled", () => {
    it.each(PLATFORMS)(
      "should return correct config for %s with all params enabled",
      (platform, flagKey) => {
        const { result } = renderWalletFeaturesConfig(platform, {
          [flagKey]: createFeatureFlag(true, ALL_PARAMS_ENABLED),
        });

        expectConfig(result, ALL_ENABLED_CONFIG);
      },
    );

    describe.each(PLATFORMS)("on %s platform", (platform, flagKey) => {
      it.each<[string, Wallet40Params, Partial<WalletFeaturesConfig>]>([
        ["marketBanner", { marketBanner: true }, { shouldDisplayMarketBanner: true }],
        ["graphRework", { graphRework: true }, { shouldDisplayGraphRework: true }],
        ["quickActionCtas", { quickActionCtas: true }, { shouldDisplayQuickActionCtas: true }],
        ["newReceiveDialog", { newReceiveDialog: true }, { shouldDisplayNewReceiveDialog: true }],
        ["mainNavigation", { mainNavigation: true }, { shouldDisplayWallet40MainNav: true }],
        ["lazyOnboarding", { lazyOnboarding: true }, { shouldUseLazyOnboarding: true }],
      ])("should return correct config when only %s is enabled", (_, params, expectedOverrides) => {
        const { result } = renderWalletFeaturesConfig(platform, {
          [flagKey]: createFeatureFlag(true, params),
        });

        expectConfig(result, {
          ...ENABLED_NO_PARAMS_CONFIG,
          ...expectedOverrides,
        });
      });

      it("should handle missing params gracefully", () => {
        const { result } = renderWalletFeaturesConfig(platform, {
          [flagKey]: createFeatureFlag(true),
        });

        expectConfig(result, ENABLED_NO_PARAMS_CONFIG);
      });

      it("should handle partial params", () => {
        const { result } = renderWalletFeaturesConfig(platform, {
          [flagKey]: createFeatureFlag(true, { marketBanner: true }),
        });

        expectConfig(result, {
          ...ENABLED_NO_PARAMS_CONFIG,
          shouldDisplayMarketBanner: true,
        });
      });
    });
  });
});
