import React from "react";
import { useLocation } from "react-router";
import { RightPanelView } from "./RightPanelView";
import {
  DEFAULT_RIGHT_PANEL_VIEW_MODEL,
  getRightPanelRouteAssetId,
  useRightPanelViewModel,
} from "./useRightPanelViewModel";

interface AssetRightPanelProps {
  readonly pathname: string;
  readonly routeAssetId: string;
}

const AssetRightPanel = ({ pathname, routeAssetId }: AssetRightPanelProps) => {
  const viewModel = useRightPanelViewModel({ pathname, routeAssetId });
  return <RightPanelView viewModel={viewModel} />;
};

/**
 * RightPanel component - Sidebar panel on the right side of the app
 * Displays the SwapWebView when enabled on supported pages (Portfolio, Market, Analytics)
 *
 * Note: Visibility is controlled by PageView.
 */
const RightPanel = () => {
  const { pathname } = useLocation();
  const routeAssetId = getRightPanelRouteAssetId(pathname);

  if (!routeAssetId) {
    return <RightPanelView viewModel={DEFAULT_RIGHT_PANEL_VIEW_MODEL} />;
  }

  return <AssetRightPanel pathname={pathname} routeAssetId={routeAssetId} />;
};

export default RightPanel;
