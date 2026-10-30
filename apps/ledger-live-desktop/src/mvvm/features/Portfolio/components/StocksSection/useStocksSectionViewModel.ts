import { useCallback } from "react";
import { useNavigate } from "react-router";
import { setTrackingSource } from "@shared/analytics";
import type { AssetNavigationMarketState } from "LLD/features/Assets/types";
import { getAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { setMarketCategory } from "~/renderer/actions/market";
import { useDispatch } from "LLD/hooks/redux";

const TRACKING_SOURCE = "Portfolio";

export function useStocksSectionViewModel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const navigateToAsset = useCallback(
    (currencyId: string, marketState?: AssetNavigationMarketState) => {
      setTrackingSource(TRACKING_SOURCE);
      navigate(getAssetDetailPath(currencyId), {
        state: marketState,
      });
    },
    [navigate],
  );

  const onSeeAll = useCallback(() => {
    setTrackingSource(TRACKING_SOURCE);
    dispatch(setMarketCategory("stocks"));
    navigate("/market");
  }, [dispatch, navigate]);

  return { navigateToAsset, onSeeAll };
}
