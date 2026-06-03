import React, { memo } from "react";
import SwapWebViewEmbedded from "~/renderer/screens/dashboard/components/SwapWebViewEmbedded";
import type { RightPanelViewModel } from "./types";

export interface RightPanelViewProps {
  readonly viewModel: RightPanelViewModel;
}

/**
 * RightPanelView
 * Displays the swap sidebar in Wallet 4.0 layout
 * Note: Visibility is controlled by PageView, this component always renders when mounted
 */
export const RightPanelView = memo(function RightPanelView({ viewModel }: RightPanelViewProps) {
  const { initialSwapState, webviewKey } = viewModel;
  return (
    <div className="flex h-full flex-col pb-32">
      <SwapWebViewEmbedded
        key={webviewKey}
        height="100%"
        isWallet40
        initialSwapState={initialSwapState}
      />
    </div>
  );
});
