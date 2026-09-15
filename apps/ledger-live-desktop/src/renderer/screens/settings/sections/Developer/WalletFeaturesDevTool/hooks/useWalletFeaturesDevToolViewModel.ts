import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { hasSeenWalletV4TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenWalletV4Tour } from "~/renderer/actions/settings";
import { WALLET_FEATURES_FLAG, WALLET_FEATURES_PARAMS, WalletFeatureParamKey } from "../constants";
import { WalletFeatureParams, WalletFeaturesViewModel } from "../types";

export const useWalletFeaturesDevToolViewModel = (): WalletFeaturesViewModel => {
  const dispatch = useDispatch();
  const featureFlag = useFeature(WALLET_FEATURES_FLAG);
  const hasSeenWalletV4Tour = useSelector(hasSeenWalletV4TourSelector);

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
