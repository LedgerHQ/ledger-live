import type { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import { ScreenName } from "~/const";
import type { SwapOperationDetails, SwapPendingOperation } from "~/screens/Swap/types";

export type SwapSubScreensNavigatorParamList = {
  [ScreenName.SwapPendingOperation]: SwapPendingOperation;
  [ScreenName.SwapHistory]: undefined;
  [ScreenName.SwapLoading]: undefined;
  [ScreenName.SwapCustomError]: { error: SwapLiveError | Error };
  [ScreenName.SwapOperationDetails]: {
    swapOperation: SwapOperationDetails;
    fromPendingOperation?: true;
  };
};
