import { KeyboardEvent, useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import type { AssetNavigationMarketState } from "LLD/features/Assets/types";
import {
  getMarketOrAssetDetailPath,
  isAssetOrMarketDetailPath,
} from "LLD/utils/marketAssetNavigation";
import { setMarketCategory } from "~/renderer/actions/market";
import { useAssetSearchBar } from "./useAssetSearchBar";
import { SearchOverlayContextValue } from "./types";
import { useDispatch } from "LLD/hooks/redux";
import { track } from "~/renderer/analytics/segment";
import { getCurrentTrackingPage, getPreviousTrackingPage } from "~/renderer/analytics/screenRefs";

export function useSearchOverlayViewModel() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const { query, onChangeQuery, isOpen, open, close, mode, suggestions, results } =
    useAssetSearchBar();

  // Keep the last mode while open so the popover fades out with its current content instead of
  // flickering the default asset list when closing clears the query.
  const [displayedMode, setDisplayedMode] = useState(mode);
  if (isOpen && displayedMode !== mode) {
    setDisplayedMode(mode);
  }

  // Searching while already on a detail page replaces the entry instead of pushing, so repeated
  // searches don't stack in history and a single Back returns to the page before the first search.
  const replace = isAssetOrMarketDetailPath(location.pathname);

  const navigateToAsset = useCallback(
    (currencyId: string, marketState?: AssetNavigationMarketState) => {
      const assetName =
        marketState &&
        "name" in marketState &&
        typeof marketState.name === "string" &&
        marketState.name
          ? marketState.name
          : currencyId;

      track("asset_clicked", {
        asset: assetName,
        page: getCurrentTrackingPage(),
        flow: "global_search",
        source: getPreviousTrackingPage(),
        // true when clicked from the search results list, false from the default suggestions list.
        searched: displayedMode === "results",
      });
      navigate(getMarketOrAssetDetailPath(currencyId, shouldDisplayAggregatedAssets), {
        state: marketState,
        replace,
      });
      close();
    },
    [navigate, shouldDisplayAggregatedAssets, close, displayedMode, replace],
  );

  const goToMarket = useCallback(
    (marketCategory: Parameters<typeof setMarketCategory>[0], trackCategory: string) => {
      dispatch(setMarketCategory(marketCategory));
      navigate("/market", { replace });
      track("button_clicked", {
        button: "see all",
        flow: "global_search",
        page: getCurrentTrackingPage(),
        category: trackCategory,
      });
      close();
    },
    [dispatch, navigate, close, replace],
  );

  const navigateToMarket = useCallback(() => goToMarket("all", "crypto"), [goToMarket]);
  const navigateToStocksMarket = useCallback(() => goToMarket("stocks", "stocks"), [goToMarket]);

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
      mode: displayedMode,
    }),
    [
      close,
      navigateToAsset,
      navigateToMarket,
      navigateToStocksMarket,
      suggestions,
      results,
      displayedMode,
    ],
  );

  return {
    open: isOpen,
    onOpenChange,
    query,
    onChangeQuery,
    onKeyDown,
    mode: displayedMode,
    contextValue,
  };
}
