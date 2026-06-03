import type { SwapNavigationState } from "LLD/features/Market/utils/swapNavigation";

export interface RightPanelViewModel {
  readonly initialSwapState?: SwapNavigationState;
  readonly webviewKey: string;
}
