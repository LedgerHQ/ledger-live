import { useCallback, useMemo } from "react";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { WALLET_FEATURES_FLAG, WALLET_FEATURES_PARAMS, WalletFeatureParamKey } from "../constants";
import { WalletFeatureParams, WalletFeaturesViewModel } from "../types";

export const useWalletFeaturesDevToolViewModel = (): WalletFeaturesViewModel => {
  const { getFeature, overrideFeature } = useFeatureFlags();

  const featureFlag = getFeature(WALLET_FEATURES_FLAG);
  const isEnabled = featureFlag?.enabled ?? false;

  const params = useMemo<WalletFeatureParams>(
    () => (featureFlag?.params as WalletFeatureParams) ?? {},
    [featureFlag?.params],
  );

  const handleToggleAll = useCallback(
    (enable: boolean) => {
      const newParams = WALLET_FEATURES_PARAMS.reduce(
        (acc, { key }) => ({ ...acc, [key]: enable }),
        {},
      );
      overrideFeature(WALLET_FEATURES_FLAG, {
        ...(featureFlag ?? {}),
        enabled: enable,
        params: { ...params, ...newParams },
      });
    },
    [featureFlag, params, overrideFeature],
  );

  const handleToggleEnabled = useCallback(() => {
    overrideFeature(WALLET_FEATURES_FLAG, {
      ...(featureFlag ?? {}),
      enabled: !isEnabled,
    });
  }, [featureFlag, isEnabled, overrideFeature]);

  const handleToggleParam = useCallback(
    (key: WalletFeatureParamKey) => {
      const currentValue = params[key] ?? false;
      overrideFeature(WALLET_FEATURES_FLAG, {
        ...(featureFlag ?? {}),
        enabled: isEnabled,
        params: { ...params, [key]: !currentValue },
      });
    },
    [featureFlag, params, isEnabled, overrideFeature],
  );

  const allEnabled = useMemo(
    () => isEnabled && WALLET_FEATURES_PARAMS.every(({ key }) => params[key] === true),
    [isEnabled, params],
  );

  return {
    featureFlag,
    isEnabled,
    params,
    allEnabled,
    handleToggleAll,
    handleToggleEnabled,
    handleToggleParam,
  };
};
