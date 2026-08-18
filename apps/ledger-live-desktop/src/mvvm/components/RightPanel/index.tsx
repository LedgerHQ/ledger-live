import React from "react";
import { useLocation } from "react-router";
import { isMarketCurrencyData } from "@ledgerhq/asset-detail";
import type { MarketStateSlice } from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { RightPanelView } from "./RightPanelView";
import {
  DEFAULT_RIGHT_PANEL_VIEW_MODEL,
  getRightPanelRouteAssetId,
  useRightPanelViewModel,
} from "./useRightPanelViewModel";

interface AssetRightPanelProps {
  readonly pathname: string;
  readonly routeAssetId: string;
  readonly marketState?: MarketStateSlice;
}

const AssetRightPanel = ({ pathname, routeAssetId, marketState }: AssetRightPanelProps) => {
  const viewModel = useRightPanelViewModel({ pathname, routeAssetId, marketState });
  return <RightPanelView viewModel={viewModel} />;
};

/**
 * RightPanel component - Sidebar panel on the right side of the app
 * Displays the SwapWebView when enabled on supported pages (Portfolio, Market, Analytics)
 *
 * Note: Visibility is controlled by PageView.
 */
const RightPanel = () => {
  const { pathname, state } = useLocation();
  const routeAssetId = getRightPanelRouteAssetId(pathname);
  const marketState = isMarketCurrencyData(state) ? state : undefined;

  if (!routeAssetId) {
    return <RightPanelView viewModel={DEFAULT_RIGHT_PANEL_VIEW_MODEL} />;
  }

  return (
    <AssetRightPanel pathname={pathname} routeAssetId={routeAssetId} marketState={marketState} />
  );
};

export default RightPanel;
