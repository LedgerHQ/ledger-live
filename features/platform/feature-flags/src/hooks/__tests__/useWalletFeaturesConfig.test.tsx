import { renderHook } from "@testing-library/react";
import type { Features } from "@shared/feature-flags";
import {
  useWalletFeaturesConfig,
  FEATURE_FLAG_KEYS,
  type Wallet40Params,
  type WalletFeaturesConfig,
  type WalletPlatform,
} from "../useWalletFeaturesConfig";
import { FEATURE_FLAGS_DEFAULTS, makeStoreWrapper } from "../../__tests__/renderWithStore";

const PLATFORMS: [WalletPlatform, "lwdWallet40" | "lwmWallet40"][] = [
  ["desktop", "lwdWallet40"],
  ["mobile", "lwmWallet40"],
];

type FlagValue = { enabled: boolean; params?: Wallet40Params };

function renderWalletFeaturesConfig(platform: WalletPlatform, flagValue?: FlagValue) {
  const flagKey = FEATURE_FLAG_KEYS[platform];
  const resolved: Features = {
    ...FEATURE_FLAGS_DEFAULTS,
    [flagKey]: flagValue ?? { enabled: false },
  };
  const { Wrapper } = makeStoreWrapper({ resolved });
  return renderHook(() => useWalletFeaturesConfig(platform), { wrapper: Wrapper });
}

function expectConfig(result: { current: WalletFeaturesConfig }, expected: WalletFeaturesConfig) {
  expect(result.current).toEqual(expected);
}

const makeConfig = (
  value: boolean,
  overrides?: Partial<WalletFeaturesConfig>,
): WalletFeaturesConfig => ({
  isEnabled: value,
  shouldDisplayMarketBanner: value,
  shouldDisplayGraphRework: value,
  shouldDisplayQuickActionCtas: value,
  shouldDisplayNewReceiveDialog: value,
  shouldDisplayWallet40MainNav: value,
  shouldUseLazyOnboarding: value,
  shouldDisplayBalanceRefreshRework: value,
  shouldDisplayTour: value,
  shouldDisplayAssetSection: value,
  shouldDisplayBrazePlacement: value,
  shouldDisplayOperationsList: value,
  shouldDisplayMyWallet: value,
  shouldDisplayAggregatedAssets: value,
  shouldDisplayPnl: value,
  shouldDisplayAssetDiscoverability: value,
  shouldDisplayEarnUpselling: value,
  shouldDisplayEarnSimulator: value,
  ...overrides,
});

const makeParams = (value: boolean): Wallet40Params => ({
  marketBanner: value,
  graphRework: value,
  quickActionCtas: value,
  newReceiveDialog: value,
  mainNavigation: value,
  lazyOnboarding: value,
  balanceRefreshRework: value,
  tour: value,
  assetSection: value,
  brazePlacement: value,
  operationsList: value,
  aggregatedAssets: value,
  myWallet: value,
  pnl: value,
  assetDiscoverability: value,
  earnUpselling: value,
  earnSimulator: value,
});

const DISABLED_CONFIG = makeConfig(false);
const ENABLED_NO_PARAMS_CONFIG = makeConfig(false, { isEnabled: true });
const ALL_CONFIG_ENABLED = makeConfig(true);
const ALL_PARAMS_ENABLED = makeParams(true);

describe("useWalletFeaturesConfig hook", () => {
  describe("when feature flag is disabled", () => {
    it.each(PLATFORMS)(
      "returns DISABLED_CONFIG for %s when the flag (%s) is disabled even with all params enabled",
      platform => {
        const { result } = renderWalletFeaturesConfig(platform, {
          enabled: false,
          params: ALL_PARAMS_ENABLED,
        });
        expectConfig(result, DISABLED_CONFIG);
      },
    );

    it.each(PLATFORMS)(
      "returns DISABLED_CONFIG for %s when the flag is disabled (default)",
      platform => {
        const { result } = renderWalletFeaturesConfig(platform);
        expectConfig(result, DISABLED_CONFIG);
      },
    );
  });

  describe("when feature flag is enabled", () => {
    it.each(PLATFORMS)("returns ALL_CONFIG_ENABLED for %s with all params enabled", platform => {
      const { result } = renderWalletFeaturesConfig(platform, {
        enabled: true,
        params: ALL_PARAMS_ENABLED,
      });
      expectConfig(result, ALL_CONFIG_ENABLED);
    });

    describe.each(PLATFORMS)("on %s platform", platform => {
      it.each<[string, Wallet40Params, Partial<WalletFeaturesConfig>]>([
        ["marketBanner", { marketBanner: true }, { shouldDisplayMarketBanner: true }],
        ["graphRework", { graphRework: true }, { shouldDisplayGraphRework: true }],
        ["quickActionCtas", { quickActionCtas: true }, { shouldDisplayQuickActionCtas: true }],
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
        ["brazePlacement", { brazePlacement: true }, { shouldDisplayBrazePlacement: true }],
        ["operationsList", { operationsList: true }, { shouldDisplayOperationsList: true }],
        ["aggregatedAssets", { aggregatedAssets: true }, { shouldDisplayAggregatedAssets: true }],
        ["myWallet", { myWallet: true }, { shouldDisplayMyWallet: true }],
        ["pnl", { pnl: true }, { shouldDisplayPnl: true }],
        ["earnUpselling", { earnUpselling: true }, { shouldDisplayEarnUpselling: true }],
        ["earnSimulator", { earnSimulator: true }, { shouldDisplayEarnSimulator: true }],
      ])("returns the correct config when only %s is enabled", (_, params, expectedOverrides) => {
        const { result } = renderWalletFeaturesConfig(platform, { enabled: true, params });
        expectConfig(result, { ...ENABLED_NO_PARAMS_CONFIG, ...expectedOverrides });
      });

      it("handles missing params gracefully", () => {
        const { result } = renderWalletFeaturesConfig(platform, { enabled: true });
        expectConfig(result, ENABLED_NO_PARAMS_CONFIG);
      });

      it("handles partial params", () => {
        const { result } = renderWalletFeaturesConfig(platform, {
          enabled: true,
          params: { marketBanner: true },
        });
        expectConfig(result, { ...ENABLED_NO_PARAMS_CONFIG, shouldDisplayMarketBanner: true });
      });
    });
  });
});
