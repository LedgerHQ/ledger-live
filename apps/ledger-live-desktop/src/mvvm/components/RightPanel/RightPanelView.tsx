import React, { memo } from "react";
import SwapWebViewEmbedded from "~/renderer/screens/dashboard/components/SwapWebViewEmbedded";
import { RightPanelViewModelResult } from "./useRightPanelViewModel";
import { RIGHT_PANEL_WIDTH } from "LLD/components/Page/constants";

type RightPanelViewProps = RightPanelViewModelResult;

/**
 * RightPanelView
 * Displays the swap sidebar in Wallet 4.0 layout
 */
export const RightPanelView = memo(function RightPanelView({ shouldDisplay }: RightPanelViewProps) {
  if (!shouldDisplay) {
    return null;
  }

  return (
    <div className="flex h-full shrink-0 flex-col py-32" style={{ width: RIGHT_PANEL_WIDTH }}>
      <SwapWebViewEmbedded height="100%" isWallet40 />
    </div>
  );
});
