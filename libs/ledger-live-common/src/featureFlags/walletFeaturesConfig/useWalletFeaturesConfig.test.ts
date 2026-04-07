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

const makeConfig = (
  value: boolean,
  overrides?: Partial<WalletFeaturesConfig>,
): WalletFeaturesConfig => ({
  isEnabled: value,
  shouldDisplayMarketBanner: value,
  shouldDisplayGraphRework: value,
  shouldDisplayQuickActionCtas: value,
  shouldDisplayQuickActionsCtasVariant: value,
  shouldDisplayNewReceiveDialog: value,
  shouldDisplayWallet40MainNav: value,
  shouldUseLazyOnboarding: value,
  shouldDisplayBalanceRefreshRework: value,
  shouldDisplayTour: value,
  shouldDisplayAssetSection: value,
  shouldDisplayOnboardingWidget: value,
  shouldDisplayBrazePlacement: value,
  shouldDisplayOperationsList: value,
  shouldDisplayAggregatedAssets: value,
  ...overrides,
});

const makeParams = (value: boolean): Wallet40Params => ({
  marketBanner: value,
  graphRework: value,
  quickActionCtas: value,
  quickActionsCtasVariant: value,
  newReceiveDialog: value,
  mainNavigation: value,
  lazyOnboarding: value,
  balanceRefreshRework: value,
  tour: value,
  assetSection: value,
  onboardingWidget: value,
  brazePlacement: value,
  operationsList: value,
  aggregatedAssets: value,
});

const DISABLED_CONFIG = makeConfig(false);
const ENABLED_NO_PARAMS_CONFIG = makeConfig(false, { isEnabled: true });
const ALL_ENABLED_CONFIG = makeConfig(true);
const ALL_PARAMS_ENABLED = makeParams(true);

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
        [
          "quickActionsCtasVariant",
          { quickActionsCtasVariant: true },
          { shouldDisplayQuickActionsCtasVariant: true },
        ],
        ["newReceiveDialog", { newReceiveDialog: true }, { shouldDisplayNewReceiveDialog: true }],
        ["mainNavigation", { mainNavigation: true }, { shouldDisplayWallet40MainNav: true }],
        ["lazyOnboarding", { lazyOnboarding: true }, { shouldUseLazyOnboarding: true }],
        [
          "balanceRefreshRework",
          { balanceRefreshRework: true },
          { shouldDisplayBalanceRefreshRework: true },
        ],
        ["tour", { tour: true }, { shouldDisplayTour: true }],
        ["assetSection", { assetSection: true }, { shouldDisplayAssetSection: true }],
        ["onboardingWidget", { onboardingWidget: true }, { shouldDisplayOnboardingWidget: true }],
        ["brazePlacement", { brazePlacement: true }, { shouldDisplayBrazePlacement: true }],
        ["operationsList", { operationsList: true }, { shouldDisplayOperationsList: true }],
        ["aggregatedAssets", { aggregatedAssets: true }, { shouldDisplayAggregatedAssets: true }],
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
