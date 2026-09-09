import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { hasSeenWalletV4TourSelector, hasSeenQ2TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenWalletV4Tour, setHasSeenQ2Tour } from "~/renderer/actions/settings";
import { isQ2ReleaseTourEnabled } from "LLD/features/Q2Tour/releaseTourGate";
import {
  RELEASE_TOUR_FLAG,
  WALLET_FEATURES_FLAG,
  WALLET_FEATURES_PARAMS,
  WalletFeatureParamKey,
} from "../constants";
import { WalletFeatureParams, WalletFeaturesViewModel } from "../types";

export const useWalletFeaturesDevToolViewModel = (): WalletFeaturesViewModel => {
  const dispatch = useDispatch();
  const featureFlag = useFeature(WALLET_FEATURES_FLAG);
  const releaseTour = useFeature(RELEASE_TOUR_FLAG);
  const hasSeenWalletV4Tour = useSelector(hasSeenWalletV4TourSelector);
  const hasSeenQ2Tour = useSelector(hasSeenQ2TourSelector);

  const isEnabled = featureFlag?.enabled ?? false;
  const isQ2TourEnabled = isQ2ReleaseTourEnabled(releaseTour);

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

  const handleToggleQ2TourHasSeen = useCallback(() => {
    dispatch(setHasSeenQ2Tour(!hasSeenQ2Tour));
  }, [dispatch, hasSeenQ2Tour]);

  const handleToggleQ2TourEnabled = useCallback(() => {
    const next = !isQ2TourEnabled;
    dispatch(
      setOverride({
        key: RELEASE_TOUR_FLAG,
        value: {
          ...(releaseTour ?? {}),
          enabled: next,
          params: { variant: next ? "q2" : releaseTour?.params?.variant },
        },
      }),
    );
  }, [dispatch, isQ2TourEnabled, releaseTour]);

  return {
    featureFlag,
    isEnabled,
    params,
    allEnabled,
    hasSeenWalletV4Tour,
    hasSeenQ2Tour,
    isQ2TourEnabled,
    handleToggleAll,
    handleToggleEnabled,
    handleToggleParam,
    handleToggleHasSeenTour,
    handleToggleQ2TourHasSeen,
    handleToggleQ2TourEnabled,
  };
};
