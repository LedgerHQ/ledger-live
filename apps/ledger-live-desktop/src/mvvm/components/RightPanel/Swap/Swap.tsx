import React from "react";
import { useLocation } from "react-router";
import { isMarketCurrencyData } from "@ledgerhq/asset-detail";
import type { MarketStateSlice } from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { SwapView } from "./SwapView";
import { DEFAULT_SWAP_VIEW_MODEL, getSwapRouteAssetId, useSwapViewModel } from "./useSwapViewModel";

interface SwapAssetProps {
  readonly pathname: string;
  readonly routeAssetId: string;
  readonly marketState?: MarketStateSlice;
}

const SwapAsset = ({ pathname, routeAssetId, marketState }: SwapAssetProps) => {
  const viewModel = useSwapViewModel({ pathname, routeAssetId, marketState });
  return <SwapView viewModel={viewModel} />;
};

/**
 * Swap
 * Displays the SwapWebView on supported pages (Portfolio, Market, Analytics).
 */
export const Swap = () => {
  const { pathname, state } = useLocation();
  const routeAssetId = getSwapRouteAssetId(pathname);
  const marketState = isMarketCurrencyData(state) ? state : undefined;

  if (!routeAssetId) {
    return <SwapView viewModel={DEFAULT_SWAP_VIEW_MODEL} />;
  }

  return <SwapAsset pathname={pathname} routeAssetId={routeAssetId} marketState={marketState} />;
};
