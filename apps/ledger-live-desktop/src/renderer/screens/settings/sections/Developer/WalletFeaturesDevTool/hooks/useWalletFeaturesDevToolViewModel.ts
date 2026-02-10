import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { hasSeenWalletV4TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenWalletV4Tour } from "~/renderer/actions/settings";
import { WALLET_FEATURES_FLAG, WALLET_FEATURES_PARAMS, WalletFeatureParamKey } from "../constants";
import { WalletFeatureParams, WalletFeaturesViewModel } from "../types";

export const useWalletFeaturesDevToolViewModel = (): WalletFeaturesViewModel => {
  const dispatch = useDispatch();
  const { getFeature, overrideFeature } = useFeatureFlags();
  const hasSeenWalletV4Tour = useSelector(hasSeenWalletV4TourSelector);

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

  const handleToggleHasSeenTour = useCallback(() => {
    dispatch(setHasSeenWalletV4Tour(!hasSeenWalletV4Tour));
  }, [dispatch, hasSeenWalletV4Tour]);

  return {
    featureFlag,
    isEnabled,
    params,
    allEnabled,
    hasSeenWalletV4Tour,
    handleToggleAll,
    handleToggleEnabled,
    handleToggleParam,
    handleToggleHasSeenTour,
  };
};
