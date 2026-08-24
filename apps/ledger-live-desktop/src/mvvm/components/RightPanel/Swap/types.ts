import type { SwapNavigationState } from "LLD/features/Market/utils/swapNavigation";

export interface SwapViewModel {
  readonly initialSwapState?: SwapNavigationState;
  readonly webviewKey: string;
}
