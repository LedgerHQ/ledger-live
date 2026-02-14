import { useCallback, useMemo } from "react";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";

const WALLET_40_FLAG = "lwmWallet40";

export const WALLET_40_PARAMS = [
  { key: "marketBanner", label: "Market Banner" },
  { key: "graphRework", label: "Graph & Balance Rework" },
  { key: "quickActionCtas", label: "Quick Action CTAs" },
  { key: "tour", label: "Tour" },
  { key: "mainNavigation", label: "Main Navigation" },
  { key: "lazyOnboarding", label: "Lazy Onboarding" },
] as const;

type WalletFeatureParamKey = (typeof WALLET_40_PARAMS)[number]["key"];
type WalletFeatureParams = Partial<Record<WalletFeatureParamKey, boolean>>;

export const useWallet40ViewModel = () => {
  const { getFeature, overrideFeature } = useFeatureFlags();

  const featureFlag = getFeature(WALLET_40_FLAG);
  const isEnabled = featureFlag?.enabled ?? false;

  const params = useMemo<WalletFeatureParams>(() => {
    if (!featureFlag?.params) return {};
    return featureFlag.params;
  }, [featureFlag?.params]);

  const handleToggleEnabled = useCallback(() => {
    overrideFeature(WALLET_40_FLAG, {
      ...featureFlag,
      enabled: !isEnabled,
    });
  }, [featureFlag, isEnabled, overrideFeature]);

  const handleToggleParam = useCallback(
    (key: WalletFeatureParamKey) => {
      const currentValue = params[key] ?? false;
      overrideFeature(WALLET_40_FLAG, {
        ...featureFlag,
        enabled: isEnabled,
        params: { ...params, [key]: !currentValue },
      });
    },
    [featureFlag, params, isEnabled, overrideFeature],
  );

  const handleToggleAll = useCallback(
    (enable: boolean) => {
      const newParams = WALLET_40_PARAMS.reduce((acc, { key }) => ({ ...acc, [key]: enable }), {});
      overrideFeature(WALLET_40_FLAG, {
        ...featureFlag,
        enabled: enable,
        params: { ...params, ...newParams },
      });
    },
    [featureFlag, params, overrideFeature],
  );

  const allEnabled = useMemo(
    () => isEnabled && WALLET_40_PARAMS.every(({ key }) => params[key] === true),
    [isEnabled, params],
  );

  return {
    isEnabled,
    params,
    allEnabled,
    handleToggleEnabled,
    handleToggleParam,
    handleToggleAll,
  };
};
