import React, { memo } from "react";
import SwapWebViewEmbedded from "~/renderer/screens/dashboard/components/SwapWebViewEmbedded";
import type { SwapViewModel } from "./types";

export interface SwapViewProps {
  readonly viewModel: SwapViewModel;
}

/**
 * SwapView
 * Displays the swap sidebar in Wallet 4.0 layout.
 * Note: Visibility is controlled by PageView, this component always renders when mounted.
 */
export const SwapView = memo(function SwapView({ viewModel }: SwapViewProps) {
  const { initialSwapState, webviewKey } = viewModel;
  return (
    <div className="flex h-full flex-col pb-32">
      <SwapWebViewEmbedded key={webviewKey} height="100%" initialSwapState={initialSwapState} />
    </div>
  );
});
