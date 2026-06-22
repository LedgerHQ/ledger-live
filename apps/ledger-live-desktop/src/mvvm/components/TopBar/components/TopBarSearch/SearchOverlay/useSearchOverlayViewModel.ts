import { KeyboardEvent, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { getMarketOrAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { setMarketCategory } from "~/renderer/actions/market";
import { useAssetSearchBar } from "./useAssetSearchBar";
import { SearchOverlayContextValue } from "./types";
import { useDispatch } from "LLD/hooks/redux";

export function useSearchOverlayViewModel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const { query, onChangeQuery, isOpen, open, close, mode, suggestions, results } =
    useAssetSearchBar();

  const navigateToAsset = useCallback(
    (currencyId: string, marketState?: MarketCurrencyData) => {
      setTrackingSource("Global Search");
      navigate(getMarketOrAssetDetailPath(currencyId, shouldDisplayAggregatedAssets), {
        state: marketState,
      });
      close();
    },
    [navigate, shouldDisplayAggregatedAssets, close],
  );

  const navigateToMarket = useCallback(() => {
    setTrackingSource("Global Search");
    dispatch(setMarketCategory("all"));
    navigate("/market");
    close();
  }, [dispatch, navigate, close]);

  const navigateToStocksMarket = useCallback(() => {
    setTrackingSource("Global Search");
    dispatch(setMarketCategory("stocks"));
    navigate("/market");
    close();
  }, [dispatch, navigate, close]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      // close() resets the query, so backdrop click / Escape clear it.
      if (next) open();
      else close();
    },
    [open, close],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        close();
        e.currentTarget.blur();
      }
    },
    [close],
  );

  const contextValue = useMemo<SearchOverlayContextValue>(
    () => ({
      close,
      navigateToAsset,
      navigateToMarket,
      navigateToStocksMarket,
      suggestions,
      results,
      mode,
    }),
    [close, navigateToAsset, navigateToMarket, navigateToStocksMarket, suggestions, results, mode],
  );

  return { open: isOpen, onOpenChange, query, onChangeQuery, onKeyDown, mode, contextValue };
}
