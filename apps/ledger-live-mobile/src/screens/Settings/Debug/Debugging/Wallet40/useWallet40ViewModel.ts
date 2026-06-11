import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";

const WALLET_40_FLAG = "lwmWallet40";

export const WALLET_40_PARAMS = [
  { key: "marketBanner", label: "Market Banner" },
  { key: "graphRework", label: "Graph & Balance Rework" },
  { key: "quickActionCtas", label: "Quick Action CTAs" },
  { key: "quickActionsCtasVariant", label: "Quick Action CTAs Variant" },
  { key: "tour", label: "Tour" },
  { key: "mainNavigation", label: "Main Navigation" },
  { key: "lazyOnboarding", label: "Lazy Onboarding" },
  { key: "balanceRefreshRework", label: "Balance Refresh Rework" },
  { key: "assetSection", label: "Asset Section" },
  { key: "brazePlacement", label: "Braze Placement (ContentBanner)" },
  { key: "operationsList", label: "TX History" },
  { key: "aggregatedAssets", label: "Aggregated Assets" },
  { key: "myWallet", label: "My Wallet" },
  { key: "assetDiscoverability", label: "Asset Discoverability" },
  { key: "pnl", label: "PnL" },
  { key: "earnUpselling", label: "Earn Upselling" },
  { key: "earnSimulator", label: "Earn Simulator" },
] as const;

type WalletFeatureParamKey = (typeof WALLET_40_PARAMS)[number]["key"];
type WalletFeatureParams = Partial<Record<WalletFeatureParamKey, boolean>>;

export const useWallet40ViewModel = () => {
  const dispatch = useDispatch();
  const featureFlag = useFeature(WALLET_40_FLAG);
  const isEnabled = featureFlag?.enabled ?? false;

  const params = useMemo<WalletFeatureParams>(() => {
    if (!featureFlag?.params) return {};
    return featureFlag.params;
  }, [featureFlag?.params]);

  const handleToggleEnabled = useCallback(() => {
    dispatch(
      setOverride({
        key: WALLET_40_FLAG,
        value: { ...featureFlag, enabled: !isEnabled },
      }),
    );
  }, [featureFlag, isEnabled, dispatch]);

  const handleToggleParam = useCallback(
    (key: WalletFeatureParamKey) => {
      const currentValue = params[key] ?? false;
      dispatch(
        setOverride({
          key: WALLET_40_FLAG,
          value: {
            ...featureFlag,
            enabled: isEnabled,
            params: { ...params, [key]: !currentValue },
          },
        }),
      );
    },
    [featureFlag, params, isEnabled, dispatch],
  );

  const handleToggleAll = useCallback(
    (enable: boolean) => {
      const newParams = WALLET_40_PARAMS.reduce((acc, { key }) => ({ ...acc, [key]: enable }), {});
      dispatch(
        setOverride({
          key: WALLET_40_FLAG,
          value: {
            ...featureFlag,
            enabled: enable,
            params: { ...params, ...newParams },
          },
        }),
      );
    },
    [featureFlag, params, dispatch],
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
