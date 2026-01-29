import React, { memo } from "react";
import SwapWebViewEmbedded from "~/renderer/screens/dashboard/components/SwapWebViewEmbedded";
import { RightPanelViewModelResult } from "./useRightPanelViewModel";

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
    <div className="flex h-full flex-col py-32">
      <SwapWebViewEmbedded height="100%" isWallet40 />
    </div>
  );
});
