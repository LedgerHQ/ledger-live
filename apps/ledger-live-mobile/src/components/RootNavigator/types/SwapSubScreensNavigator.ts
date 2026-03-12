import type { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import type { SwapOperation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import type { SwapOperationDetails } from "~/screens/Swap/types";

export type SwapSubScreensNavigatorParamList = {
  [ScreenName.SwapPendingOperation]: { swapOperation: SwapOperation };
  [ScreenName.SwapHistory]: undefined;
  [ScreenName.SwapLoading]: undefined;
  [ScreenName.SwapCustomError]: { error: SwapLiveError | Error };
  [ScreenName.SwapOperationDetails]: {
    swapOperation: SwapOperationDetails;
    fromPendingOperation?: true;
  };
};
