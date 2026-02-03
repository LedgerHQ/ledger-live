import React from "react";
import { useRightPanelViewModel } from "./useRightPanelViewModel";
import { RightPanelView } from "./RightPanelView";

/**
 * RightPanel component - Sidebar panel on the right side of the app
 * Displays the SwapWebView when enabled on supported pages (Portfolio, Market, Analytics)
 *
 * Follows MVVM pattern: Container → ViewModel → View
 */
const RightPanel = () => {
  const viewModel = useRightPanelViewModel();

  return <RightPanelView {...viewModel} />;
};

export default RightPanel;
