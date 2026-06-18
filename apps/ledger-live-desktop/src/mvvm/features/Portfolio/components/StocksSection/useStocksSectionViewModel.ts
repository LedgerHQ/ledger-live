import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import type { AssetNavigationMarketState } from "LLD/features/Assets/types";
import { getMarketOrAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { setMarketCategory } from "~/renderer/actions/market";
import { useDispatch } from "LLD/hooks/redux";

const TRACKING_SOURCE = "Portfolio";

export function useStocksSectionViewModel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");

  const navigateToAsset = useCallback(
    (currencyId: string, marketState?: AssetNavigationMarketState) => {
      setTrackingSource(TRACKING_SOURCE);
      navigate(getMarketOrAssetDetailPath(currencyId, shouldDisplayAggregatedAssets), {
        state: marketState,
      });
    },
    [navigate, shouldDisplayAggregatedAssets],
  );

  const onSeeAll = useCallback(() => {
    setTrackingSource(TRACKING_SOURCE);
    dispatch(setMarketCategory("stocks"));
    navigate("/market");
  }, [dispatch, navigate]);

  return { navigateToAsset, onSeeAll };
}
