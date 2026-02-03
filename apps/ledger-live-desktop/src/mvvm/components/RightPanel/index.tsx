import React from "react";
import { RightPanelView } from "./RightPanelView";

/**
 * RightPanel component - Sidebar panel on the right side of the app
 * Displays the SwapWebView when enabled on supported pages (Portfolio, Market, Analytics)
 *
 * Note: Visibility is controlled by PageView using useRightPanelViewModel
 */
const RightPanel = () => {
  return <RightPanelView />;
};

export default RightPanel;
