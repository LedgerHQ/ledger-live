import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { WALLET_FEATURES_FLAG, WALLET_FEATURES_PARAMS, WalletFeatureParamKey } from "../constants";
import { WalletFeatureParams, WalletFeaturesViewModel } from "../types";

export const useWalletFeaturesDevToolViewModel = (): WalletFeaturesViewModel => {
  const dispatch = useDispatch();
  const featureFlag = useFeature(WALLET_FEATURES_FLAG);

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
      dispatch(
        setOverride({
          key: WALLET_FEATURES_FLAG,
          value: {
            ...(featureFlag ?? {}),
            enabled: enable,
            params: { ...params, ...newParams },
          },
        }),
      );
    },
    [dispatch, featureFlag, params],
  );

  const handleToggleEnabled = useCallback(() => {
    dispatch(
      setOverride({
        key: WALLET_FEATURES_FLAG,
        value: { ...(featureFlag ?? {}), enabled: !isEnabled },
      }),
    );
  }, [dispatch, featureFlag, isEnabled]);

  const handleToggleParam = useCallback(
    (key: WalletFeatureParamKey) => {
      const currentValue = params[key] ?? false;
      dispatch(
        setOverride({
          key: WALLET_FEATURES_FLAG,
          value: {
            ...(featureFlag ?? {}),
            enabled: isEnabled,
            params: { ...params, [key]: !currentValue },
          },
        }),
      );
    },
    [dispatch, featureFlag, params, isEnabled],
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
